# M7 — Integración de Pagos con MercadoPago

**Fecha:** 2026-03-23
**Estado:** Aprobado
**Scope:** Checkout Pro, depósito configurable, pago de saldo desde admin, webhook automático

---

## Contexto

El flujo actual de agendamiento crea el pedido en BD y muestra una página de confirmación que indica "te contactaremos por WhatsApp para coordinar el pago". No existe ninguna integración de pago online.

Este spec cubre la integración completa de MercadoPago para el mercado chileno (RM). Stripe queda fuera de scope.

---

## Requisitos funcionales

1. **Depósito al agendar:** El cliente debe pagar un depósito (% configurable, default 50%) para confirmar el agendamiento. No puede completar el booking sin pago.
2. **Pago total opcional:** El cliente puede elegir pagar el 100% al momento de agendar.
3. **Pedido ante fallo de pago:** Si el cliente abandona o falla el pago, el pedido se crea igualmente con status `pending_payment` para que el admin pueda contactarlo.
4. **Pago de saldo (admin):** Cuando el depósito fue pagado, el admin genera un link de pago para el saldo restante y lo envía por WhatsApp.
5. **Actualización automática:** El webhook de MP actualiza el `payment_status` a `paid` automáticamente cuando se confirma el pago del 100%.
6. **Registro de transacciones:** Cada pago exitoso se registra en la tabla `transactions`.
7. **Señales de confianza:** En el paso de pago se muestran los logos de MercadoPago, "Pago seguro" y otros trust signals.
8. **% depósito configurable:** La dueña puede modificar el porcentaje de depósito desde el panel de configuración del admin.

---

## Decisiones de diseño

### Checkout Pro con redirección
Se usa MercadoPago Checkout Pro (redirección). El cliente es llevado al dominio oficial de MP para pagar, lo que maximiza la confianza y compatibilidad con todos los medios de pago (tarjetas, transferencia bancaria, efectivo). No se implementan Bricks ni popup.

### Pedido creado antes del pago
El pedido se crea en BD con `status: pending_payment` antes de redirigir al checkout. Esto evita pérdida de datos en caso de falla técnica del webhook, y permite al admin ver y contactar clientes que abandonaron el pago.

El status `pending_payment` **no cuenta para la capacidad diaria** (`daily_capacity`). La capacidad se incrementa solo cuando el webhook confirma el pago.

### Identificación via `external_reference`
La preferencia de MP incluye el `order_number` como `external_reference` (ej. `DD-20260323-001`), permitiendo al webhook identificar el pedido de forma determinista.

---

## Flujo de pago al agendar

```
1. Cliente llena formulario de agendamiento
2. Click "Ir a pagar" → se crean pedido (pending_payment) + preferencia MP
3. Redirección a checkout.mercadopago.com
   ├── Pago exitoso → MP redirige a /agendar/confirmacion?order=XXX&status=approved
   └── Pago fallido/abandono → MP redirige a /agendar/confirmacion?order=XXX&status=failure
4. Webhook /api/webhooks/mercadopago recibe notificación:
   ├── Depósito (50%) pagado → status: pending, payment_status: partial, deposit_paid: true
   └── Total (100%) pagado  → status: pending, payment_status: paid
5. Se registra transacción en tabla transactions
6. Se envía email de confirmación al cliente
```

---

## Flujo de pago de saldo (admin)

```
1. Admin abre pedido con payment_status: partial
2. Sección "Pago" muestra saldo pendiente y botón "Generar link de saldo"
3. Click → POST /api/payments/balance-link → crea preferencia MP con monto restante
4. Se muestra el link + botón "Copiar" + botón "Enviar por WhatsApp"
5. WhatsApp abre wa.me/56939282764?text=... con mensaje pre-escrito + link
6. Cliente paga el saldo
7. Webhook actualiza payment_status: paid automáticamente
```

---

## Estados de pago

| `status` del pedido | `payment_status` | Descripción |
|---|---|---|
| `pending_payment` | `pending` | En checkout MP, esperando |
| `pending` | `partial` | Depósito pagado (50%), saldo pendiente |
| `pending` | `paid` | Pago completo (100%) |
| `pending` | `pending` | Pedido sin pago (abandonado, admin contacta) |

---

## Arquitectura — Archivos

### Nuevos
```
lib/payments/mercadopago.ts                  ← cliente MP + helpers (crear preferencia, verificar pago)
app/api/payments/preference/route.ts         ← POST: crea preferencia de pago inicial (depósito/total)
app/api/webhooks/mercadopago/route.ts        ← POST: recibe IPN/webhooks de MP
app/api/payments/balance-link/route.ts       ← POST: genera link de pago de saldo (protegido, solo admin)
```

### Modificados
```
app/(public)/agendar/page.tsx                ← reemplaza submit directo por paso de pago con trust signals
app/(public)/agendar/confirmacion/page.tsx   ← maneja ?status=approved|failure|pending
lib/supabase/booking-mutations.ts            ← createBooking usa status pending_payment
app/admin/pedidos/[id]/page.tsx              ← sección de pago con generar link + WhatsApp
app/admin/configuracion/page.tsx             ← campo deposit_percentage en settings
```

---

## lib/payments/mercadopago.ts

Responsabilidades:
- Inicializar cliente MP con `MERCADOPAGO_ACCESS_TOKEN`
- `createPreference(order, amount, type)` → retorna `init_point` (URL checkout) y `preference_id`
- `getPayment(paymentId)` → retorna datos del pago para verificar en webhook
- `verifyWebhookSignature(headers, body)` → valida `x-signature` header

---

## POST /api/payments/preference

```typescript
// Input
{ orderId: string, paymentType: 'deposit' | 'full' }

// Lógica
1. Obtener pedido + setting deposit_percentage
2. Calcular monto: deposit → total * (percentage/100), full → total
3. Crear preferencia MP con:
   - items: [{ title: "Pedido DeliDanis #XXX", unit_price: monto, quantity: 1 }]
   - external_reference: order_number
   - back_urls: { success, failure, pending } → /agendar/confirmacion?order=XXX
   - auto_return: "approved"
   - notification_url: NEXT_PUBLIC_APP_URL/api/webhooks/mercadopago
4. Retornar { init_point, preference_id }
```

---

## POST /api/webhooks/mercadopago

```typescript
// MP envía: { type: "payment", data: { id: "123456" } }
1. Verificar x-signature (HMAC SHA256 con MP_WEBHOOK_SECRET)
2. GET https://api.mercadopago.com/v1/payments/{id}
3. Extraer external_reference → buscar pedido por order_number
4. Según status del pago:
   - "approved":
     - Calcular si monto ~= depósito o ~= total (±1% tolerancia)
     - Actualizar pedido en BD (status, payment_status, deposit_paid, payment_reference)
     - Incrementar daily_capacity si aplica
     - Insertar en transactions
     - Enviar email confirmación
   - "rejected" / "cancelled": log, no hacer nada
5. Retornar 200 OK siempre (MP reintenta si no recibe 200)
```

---

## POST /api/payments/balance-link

```typescript
// Protegido con sesión admin
// Input: { orderId: string }
// Lógica:
1. Verificar que payment_status === "partial"
2. Calcular saldo = total - deposit_amount
3. Crear preferencia MP con el saldo
4. Retornar { payment_url, preference_id }
```

---

## Panel admin — Sección pago en detalle pedido

Visible cuando `payment_status !== "paid"`:

```
Depósito pagado:    $45.000  ✓
Saldo pendiente:    $45.000
Total:              $90.000

[Generar link de saldo]          ← solo si payment_status === "partial"

── tras generar ──
Link: https://mpago.la/xxxx  [Copiar]
[📱 Enviar por WhatsApp]
```

Mensaje WhatsApp pre-escrito:
```
Hola [nombre], te enviamos el link de pago del saldo de tu pedido [número] por $[monto]:
[link]
```

---

## Configuración — deposit_percentage

En `admin/configuracion`, sección "Pagos":
- Input numérico: "Porcentaje de depósito (%)" con valor default 50
- Persiste en tabla `settings` con key `deposit_percentage`
- Validación: entre 10 y 100

---

## Variables de entorno necesarias

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...    # test o prod
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=             # desde panel MP → Webhooks
```

---

## Trust signals en paso de pago

En la página de agendamiento, antes de redirigir a MP:
- Logo oficial de MercadoPago
- Badge "Pago 100% seguro"
- Ícono de candado SSL
- Texto: "Serás redirigido al sitio oficial de MercadoPago para completar tu pago de forma segura"
- Desglose del monto: subtotal, depósito a pagar ahora, saldo a pagar después

---

## Fuera de scope (este milestone)

- Stripe
- Reembolsos automáticos
- Cuotas / financiamiento
- Pago en efectivo en tienda
- Notificaciones WhatsApp automáticas (M9)
