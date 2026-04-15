# Order Product Selector + Payment Status Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the E2E admin order flow so that: (1) products are selected from the catalog with a cascading dropdown instead of free text, giving orders a real `product_id`; and (2) `payment_status` is recalculated automatically after every manual payment.

**Architecture:** Two isolated changes. First fix is in `orders-queries.ts`: a private helper `recalculatePaymentStatus` called after every `addPayment` and after the initial payment in `createManualOrder`. Second fix is in `nuevo/page.tsx`: replace the free-text product name field with a category-type tab selector followed by a product dropdown, storing the structured `service_data` format that the production module already expects.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Supabase JS client, Tailwind CSS.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/supabase/orders-queries.ts` | Modify | Add `recalculatePaymentStatus`, wire into `addPayment` and `createManualOrder` |
| `app/admin/agendamientos/nuevo/page.tsx` | Modify | Replace free-text product input with cascading category → product selector |

---

## Task 1: Add `recalculatePaymentStatus` helper and wire into `addPayment`

**Files:**
- Modify: `lib/supabase/orders-queries.ts`

### Steps

- [ ] **Step 1.1 — Open `lib/supabase/orders-queries.ts` and add the private helper right before `addPayment`**

Insert this block at line ~311 (just before `export async function addPayment`):

```typescript
// Private helper — recalculates and writes payment_status based on sum of all payments
const PAYMENT_TOLERANCE = 10 // $10 CLP rounding tolerance

async function recalculatePaymentStatus(orderId: string): Promise<void> {
  const { data: payments } = await supabase
    .from('order_payments')
    .select('amount')
    .eq('order_id', orderId)

  const totalPaid = (payments || []).reduce(
    (sum, p) => sum + (parseFloat(String(p.amount)) || 0),
    0
  )

  const { data: order } = await supabase
    .from('orders')
    .select('total')
    .eq('id', orderId)
    .single()

  if (!order) return

  const orderTotal = parseFloat(String(order.total)) || 0

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

- [ ] **Step 1.2 — Wire `recalculatePaymentStatus` at the end of `addPayment`**

The current `addPayment` function ends with `return data`. Change it so that after the insert succeeds, the helper is called before returning:

```typescript
export async function addPayment(
  orderId: string,
  amount: number,
  paymentMethod: string,
  reference?: string,
  notes?: string,
  userId?: string
) {
  const { data, error } = await supabase
    .from('order_payments')
    .insert({
      order_id: orderId,
      amount,
      payment_method: paymentMethod,
      reference,
      notes,
      created_by: userId
    })
    .select()
    .single()

  if (error) throw error

  // Recalculate payment_status after every manual payment
  await recalculatePaymentStatus(orderId)

  return data
}
```

- [ ] **Step 1.3 — Run TypeScript check**

```bash
cd "C:\Users\gonza\OneDrive\Escritorio\Proyectos Web\DeliDanis"
npx tsc --noEmit
```

Expected: no errors in `lib/supabase/orders-queries.ts`.

- [ ] **Step 1.4 — Commit**

```bash
git add lib/supabase/orders-queries.ts
git commit -m "fix: recalcular payment_status automaticamente tras cada pago manual"
```

---

## Task 2: Wire `recalculatePaymentStatus` into `createManualOrder` initial payment

**Files:**
- Modify: `lib/supabase/orders-queries.ts`

`recalculatePaymentStatus` is already called inside `addPayment`, which `createManualOrder` calls. No extra call is needed. This task verifies the chain works and adds a comment for clarity.

### Steps

- [ ] **Step 2.1 — Verify the chain in `createManualOrder`**

Find the block in `createManualOrder` (around line 577) that calls `addPayment`. It should look like:

```typescript
// 5. Registrar pago inicial si existe
if (orderData.initial_payment && orderData.initial_payment.amount > 0) {
  await addPayment(
    order.id,
    orderData.initial_payment.amount,
    orderData.initial_payment.payment_method,
    orderData.initial_payment.reference
  )
  // recalculatePaymentStatus is called inside addPayment — payment_status is up to date
}
```

If the comment is missing, add it. If the structure is different, verify `addPayment` is still awaited (not fire-and-forget).

- [ ] **Step 2.2 — Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2.3 — Commit**

```bash
git add lib/supabase/orders-queries.ts
git commit -m "fix: pago inicial en createManualOrder actualiza payment_status via addPayment"
```

---

## Task 3: Replace free-text product input with cascading category/product selector

**Files:**
- Modify: `app/admin/agendamientos/nuevo/page.tsx`

### Steps

- [ ] **Step 3.1 — Add catalog query imports at the top of `nuevo/page.tsx`**

Add the following import alongside the existing imports (after the `createManualOrder` import):

```typescript
import {
  getCakeProductsAdmin,
  getPastryProductsAdmin,
  getCocktailProductsAdmin,
} from '@/lib/supabase/catalog-mutations'
```

- [ ] **Step 3.2 — Update the `OrderItem` interface to include `product_id` and `service_data`**

Find the existing interface at the top of the file:

```typescript
interface OrderItem {
  id: string
  service_type: string
  product_name: string
  quantity: number
  portions?: number
  unit_price: number
  total_price: number
}
```

Replace it with:

```typescript
interface OrderItem {
  id: string
  service_type: 'torta' | 'pasteleria' | 'cocteleria'
  product_name: string
  product_id: string
  service_data: Record<string, unknown>
  quantity: number
  portions?: number
  unit_price: number
  total_price: number
}

type CategoryType = 'torta' | 'pasteleria' | 'cocteleria'

interface CatalogProduct {
  id: string
  name: string
  base_price: number
}

const CATEGORY_TABS: { value: CategoryType; label: string }[] = [
  { value: 'torta', label: 'Tortas' },
  { value: 'pasteleria', label: 'Pastelería' },
  { value: 'cocteleria', label: 'Coctelería' },
]
```

- [ ] **Step 3.3 — Add state variables for the cascading selector**

Inside `NuevoAgendamientoPage`, after the existing `const [newItem, setNewItem] = useState(...)` block, add:

```typescript
// Catalog selector state
const [selectedCategory, setSelectedCategory] = useState<CategoryType>('torta')
const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([])
const [selectedProductId, setSelectedProductId] = useState('')
const [isLoadingProducts, setIsLoadingProducts] = useState(false)
```

- [ ] **Step 3.4 — Add `useEffect` to load products when category changes**

Add this after the state declarations:

```typescript
useEffect(() => {
  setIsLoadingProducts(true)
  setSelectedProductId('')
  setNewItem(prev => ({ ...prev, unit_price: 0 }))

  const load = async () => {
    try {
      let data: CatalogProduct[] = []
      if (selectedCategory === 'torta') {
        const result = await getCakeProductsAdmin()
        data = result.map((p: any) => ({ id: p.id, name: p.name, base_price: p.base_price ?? 0 }))
      } else if (selectedCategory === 'pasteleria') {
        const result = await getPastryProductsAdmin()
        data = result.map((p: any) => ({ id: p.id, name: p.name, base_price: p.base_price ?? 0 }))
      } else {
        const result = await getCocktailProductsAdmin()
        data = result.map((p: any) => ({ id: p.id, name: p.name, base_price: p.base_price ?? 0 }))
      }
      setCatalogProducts(data)
    } catch (err) {
      console.error('Error loading catalog:', err)
      setCatalogProducts([])
    } finally {
      setIsLoadingProducts(false)
    }
  }

  load()
}, [selectedCategory])
```

- [ ] **Step 3.5 — Add `useEffect` to auto-fill price when product is selected**

```typescript
useEffect(() => {
  if (!selectedProductId) return
  const product = catalogProducts.find(p => p.id === selectedProductId)
  if (product) {
    setNewItem(prev => ({ ...prev, unit_price: product.base_price }))
  }
}, [selectedProductId, catalogProducts])
```

- [ ] **Step 3.6 — Update the `addItem` function to build correct `service_data`**

Replace the existing `addItem` function:

```typescript
const addItem = () => {
  if (!selectedProductId || newItem.unit_price <= 0) return

  const product = catalogProducts.find(p => p.id === selectedProductId)
  if (!product) return

  let service_data: Record<string, unknown>
  if (selectedCategory === 'torta') {
    service_data = { product: { id: product.id, name: product.name } }
  } else {
    service_data = {
      itemsDetails: [{
        productId: product.id,
        productName: product.name,
        quantity: newItem.quantity,
      }],
    }
  }

  const item: OrderItem = {
    id: Date.now().toString(),
    service_type: selectedCategory,
    product_name: product.name,
    product_id: product.id,
    service_data,
    quantity: newItem.quantity,
    portions: selectedCategory === 'torta' && newItem.portions > 0
      ? newItem.portions
      : undefined,
    unit_price: newItem.unit_price,
    total_price: newItem.unit_price * newItem.quantity,
  }

  setItems([...items, item])
  setSelectedProductId('')
  setNewItem({ product_name: '', quantity: 1, portions: 0, unit_price: 0 })
}
```

- [ ] **Step 3.7 — Update `handleSubmit` items mapping to include `product_id` and `service_data`**

Find the `items` mapping inside `handleSubmit` (around line 153):

```typescript
items: items.map(item => ({
  service_type: item.service_type,
  product_name: item.product_name,
  quantity: item.quantity,
  portions: item.portions,
  unit_price: item.unit_price,
  total_price: item.total_price,
})),
```

Replace with:

```typescript
items: items.map(item => ({
  service_type: item.service_type,
  product_name: item.product_name,
  quantity: item.quantity,
  portions: item.portions,
  unit_price: item.unit_price,
  total_price: item.total_price,
  service_data: item.service_data,
})),
```

- [ ] **Step 3.8 — Replace the product input UI block in the form**

Find the current `{/* Formulario para agregar item */}` block (around line 373). Replace the entire `<div className="grid grid-cols-1 md:grid-cols-5 ...">` block with:

```tsx
{/* Category tabs */}
<div className="flex gap-2 mb-3">
  {CATEGORY_TABS.map(tab => (
    <button
      key={tab.value}
      type="button"
      onClick={() => setSelectedCategory(tab.value)}
      className={cn(
        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
        selectedCategory === tab.value
          ? 'bg-primary text-white'
          : 'bg-secondary text-dark-light hover:bg-gray-200'
      )}
    >
      {tab.label}
    </button>
  ))}
</div>

{/* Product + quantity + price row */}
<div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-secondary/50 rounded-lg">
  {/* Product dropdown */}
  <div className="md:col-span-2">
    {isLoadingProducts ? (
      <div className="w-full px-3 py-2 border border-border rounded-lg text-dark-light text-sm">
        Cargando productos...
      </div>
    ) : (
      <select
        value={selectedProductId}
        onChange={e => setSelectedProductId(e.target.value)}
        className="w-full px-3 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
      >
        <option value="">Seleccionar producto...</option>
        {catalogProducts.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    )}
  </div>

  {/* Quantity */}
  <div>
    <input
      type="number"
      placeholder="Cantidad"
      value={newItem.quantity}
      onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
      min="1"
      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  </div>

  {/* Portions (tortas only) */}
  {selectedCategory === 'torta' && (
    <div>
      <input
        type="number"
        placeholder="Porciones"
        value={newItem.portions || ''}
        onChange={e => setNewItem({ ...newItem, portions: parseInt(e.target.value) || 0 })}
        min="1"
        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  )}

  {/* Price */}
  <div>
    <input
      type="number"
      placeholder="Precio"
      value={newItem.unit_price || ''}
      onChange={e => setNewItem({ ...newItem, unit_price: parseInt(e.target.value) || 0 })}
      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  </div>

  {/* Add button — takes remaining column(s) */}
  <div className={selectedCategory === 'torta' ? '' : 'md:col-start-5'}>
    <Button type="button" onClick={addItem} className="w-full">
      Agregar
    </Button>
  </div>
</div>
```

- [ ] **Step 3.9 — Remove unused `product_name` field from `newItem` state**

The `newItem` state still carries `product_name` which is no longer edited directly. Update the initial state and reset:

Find:
```typescript
const [newItem, setNewItem] = useState({
  product_name: '',
  quantity: 1,
  portions: 0,
  unit_price: 0,
})
```

Replace with:
```typescript
const [newItem, setNewItem] = useState({
  quantity: 1,
  portions: 0,
  unit_price: 0,
})
```

And update all `setNewItem` reset calls (in `addItem`) from:
```typescript
setNewItem({ product_name: '', quantity: 1, portions: 0, unit_price: 0 })
```
to:
```typescript
setNewItem({ quantity: 1, portions: 0, unit_price: 0 })
```

- [ ] **Step 3.10 — Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors. If there are errors about `product_name` on `newItem`, confirm it was removed from all usages in the file.

- [ ] **Step 3.11 — Commit**

```bash
git add app/admin/agendamientos/nuevo/page.tsx
git commit -m "fix: selector cascada categoria/producto en formulario de nuevo agendamiento"
```

---

## Task 4: Manual E2E Verification

**Files:** None modified — this is a verification task.

### Steps

- [ ] **Step 4.1 — Start dev server**

```bash
npm run dev
```

- [ ] **Step 4.2 — Verify selector de producto**

1. Navigate to `http://localhost:3000/admin/agendamientos/nuevo`
2. Scroll to the "Servicios / Productos" section
3. Verify three category tabs are visible: Tortas / Pastelería / Coctelería
4. Click "Tortas" → dropdown should populate with cake products from the catalog
5. Select a product → verify price auto-fills
6. Click "Agregar" → item appears in the list with the product name
7. Repeat for Pastelería and Coctelería tabs
8. Fill in customer data, date, click "Crear Agendamiento"
9. Verify order is created without errors

- [ ] **Step 4.3 — Verify production extraction**

1. Go to the created order and change its status to "Confirmado"
2. Navigate to `http://localhost:3000/admin/produccion`
3. Click "+ Nueva Producción" → select "Producir para un pedido"
4. Select the order created in Step 4.2
5. Verify the products are listed (not "No se pudieron extraer productos")
6. Create the production order
7. Verify the production order appears in the Kanban with status "Pendiente"

- [ ] **Step 4.4 — Verify payment_status recalculation (manual payment)**

1. Go to the agendamientos list
2. Open the order created in Step 4.2
3. Click "Registrar Pago"
4. Enter a partial amount (less than the total)
5. Verify `payment_status` changes to "Parcial" in the order list
6. Add another payment that completes the total
7. Verify `payment_status` changes to "Pagado"

- [ ] **Step 4.5 — Verify payment_status on order creation with initial payment**

1. Create a new order via `http://localhost:3000/admin/agendamientos/nuevo`
2. Check "Registrar pago/abono inicial" and enter the full order total
3. Submit the form
4. Open the created order — verify `payment_status` is "Pagado" (not "Pendiente")

- [ ] **Step 4.6 — Final commit if any fixes were made during verification**

```bash
git add -p
git commit -m "fix: correcciones menores tras verificacion E2E"
```

---

## Self-Review Checklist

- [x] **Spec coverage — Bug 1 (selector libre):** Task 3 completo — reemplaza texto libre con cascada categoría → producto → stores `product_id` + `service_data`.
- [x] **Spec coverage — Bug 2 (payment_status manual):** Task 1 completo — `recalculatePaymentStatus` + wire en `addPayment`.
- [x] **Spec coverage — Bug 3 (producción):** Derivado de Bug 1, resuelto por Task 3.
- [x] **Spec coverage — Bug 4 (pago inicial):** Task 2 verifica que `createManualOrder` → `addPayment` → `recalculatePaymentStatus` ya funciona por la cadena.
- [x] **Sin placeholders:** Todos los pasos muestran código completo.
- [x] **Consistencia de tipos:** `CategoryType`, `CatalogProduct`, `OrderItem` definidos en Task 3 Step 3.2 y usados consistentemente en Steps 3.3–3.9.
- [x] **MercadoPago webhook:** No tocado, confirmado en scope.
