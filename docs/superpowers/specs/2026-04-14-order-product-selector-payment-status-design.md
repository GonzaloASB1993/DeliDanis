# Spec: Fix Product Selector + Payment Status E2E Flow

**Date:** 2026-04-14  
**Status:** Approved

---

## Problem Summary

Two root bugs break the E2E flow from order creation through production:

1. **Product selector is free-text** — admin creates orders by typing a product name. No `product_id`, no structured `service_type`. The production module can't extract products from these orders → production modal shows "No se pudieron extraer productos de este pedido".

2. **`addPayment()` doesn't recalculate `payment_status`** — inserting a manual payment (cash, transfer, card) never updates `orders.payment_status`. The order stays as `pending` even after full payment. Only the MercadoPago webhook correctly recalculates this.

Bug 3 (production recipe/inventory) and Bug 4 (initial payment status) are downstream consequences of these two root bugs.

---

## Scope

Files changed:
- `app/admin/agendamientos/nuevo/page.tsx` — replace free-text with cascading category/product selector
- `lib/supabase/orders-queries.ts` — add `recalculatePaymentStatus`, call it from `addPayment` and `createManualOrder`

Files NOT changed:
- `app/api/webhooks/mercadopago/route.ts` — webhook payment logic is already correct
- `lib/supabase/production-queries.ts` — production flow already correct once `product_id` exists
- All other files

---

## Design

### 1. Cascading Product Selector (`nuevo/page.tsx`)

Replace the free-text product name input with a three-step selector:

**Step 1 — Category type tabs:**
```
[ Tortas ] [ Pastelería ] [ Coctelería ]
```
Maps to `service_type`: `'torta'` / `'pasteleria'` / `'cocteleria'`

**Step 2 — Product dropdown:**
Loads products from the matching catalog table when tab changes:
- `Tortas` → `getCakeProductsAdmin()`
- `Pastelería` → `getPastryProductsAdmin()`
- `Coctelería` → `getCocktailProductsAdmin()`

**Step 3 — Quantity, portions (tortas only), price:**
- `unit_price` auto-fills from `base_price` of selected product (admin can override)
- `portions` field only shown for `service_type === 'torta'`

**On "Agregar":**

For tortas, the item is stored with:
```typescript
service_type: 'torta'
product_name: selectedProduct.name
service_data: { product: { id: selectedProduct.id, name: selectedProduct.name } }
```

For pastelería/coctelería:
```typescript
service_type: 'pasteleria' | 'cocteleria'
product_name: selectedProduct.name
service_data: { itemsDetails: [{ productId: selectedProduct.id, productName: selectedProduct.name, quantity }] }
```

This matches exactly what `extractProductsFromOrder` in `NewProductionModal.tsx` expects.

**State shape added to the form:**
```typescript
const [selectedCategory, setSelectedCategory] = useState<'torta' | 'pasteleria' | 'cocteleria'>('torta')
const [catalogProducts, setCatalogProducts] = useState<Array<{ id: string; name: string; base_price: number }>>([])
const [selectedProductId, setSelectedProductId] = useState('')
const [isLoadingProducts, setIsLoadingProducts] = useState(false)
```

When `selectedCategory` changes: reset `selectedProductId`, load products via the matching admin query function.

When `selectedProductId` changes: auto-fill `newItem.unit_price` with the selected product's `base_price`.

The `OrderItem` interface gains two fields:
```typescript
interface OrderItem {
  // ...existing fields...
  product_id: string       // product UUID
  service_data: Record<string, unknown>  // structured data for production
}
```

### 2. Payment Status Recalculation (`orders-queries.ts`)

Add a private helper (not exported):

```typescript
const PAYMENT_TOLERANCE = 10 // $10 CLP rounding tolerance

async function recalculatePaymentStatus(orderId: string): Promise<void> {
  // Get total paid
  const { data: payments } = await supabase
    .from('order_payments')
    .select('amount')
    .eq('order_id', orderId)

  const totalPaid = (payments || []).reduce(
    (sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0
  )

  // Get order total
  const { data: order } = await supabase
    .from('orders')
    .select('total')
    .eq('id', orderId)
    .single()

  if (!order) return

  const orderTotal = parseFloat(String(order.total)) || 0

  // Determine status
  let paymentStatus: 'paid' | 'partial' | 'pending'
  if (totalPaid >= orderTotal - PAYMENT_TOLERANCE) {
    paymentStatus = 'paid'
  } else if (totalPaid > 0) {
    paymentStatus = 'partial'
  } else {
    paymentStatus = 'pending'
  }

  await supabase
    .from('orders')
    .update({ payment_status: paymentStatus })
    .eq('id', orderId)
}
```

**Called in two places:**

1. End of `addPayment()` — after the insert succeeds:
```typescript
await recalculatePaymentStatus(orderId)
```

2. End of `createManualOrder()` — after `addPayment` for initial_payment:
```typescript
if (orderData.initial_payment && orderData.initial_payment.amount > 0) {
  await addPayment(...)
  // recalculatePaymentStatus is called inside addPayment, no extra call needed
}
```

The MercadoPago webhook is NOT changed — it already has its own correct recalculation logic.

---

## E2E Flow After Fix

| Step | Before fix | After fix |
|------|-----------|-----------|
| Crear pedido | Texto libre, `service_type: 'custom'`, sin `product_id` | Dropdown cascada, `service_type` correcto, `product_id` en `service_data` |
| Pago inicial al crear | `payment_status` queda `pending` | `payment_status` calculado automáticamente |
| Confirmar pedido | OK | OK (sin cambios) |
| Nueva Producción → seleccionar pedido | "No se pudieron extraer productos" | Extrae productos correctamente, crea `production_movements` con receta |
| Status pedido → `in_production` | No ocurre para pedidos admin | Ocurre automáticamente al crear producción |
| Pago manual (efectivo/transferencia) | `payment_status` queda `pending` | Se recalcula: `partial` o `paid` |
| Pago MercadoPago | OK | OK (sin cambios) |

---

## Risks & Notes

- **Precio editable**: El admin puede sobrescribir el `base_price` auto-relleno. Esto es intencional — puede haber descuentos o ajustes por porciones.
- **Tolerancia de pago**: Se usa `$10 CLP` igual que el webhook de MercadoPago para consistencia.
- **Pedidos existentes**: Los pedidos ya creados con texto libre no se migran. La producción de esos pedidos seguirá requiriendo crearse manualmente por stock.
- **`calculate_customer_stats` RPC**: Ya existente en `createManualOrder`, no se modifica.
