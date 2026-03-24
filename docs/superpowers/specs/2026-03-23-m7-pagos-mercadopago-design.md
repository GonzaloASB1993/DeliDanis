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
1. Cliente llena formulario → click "Ir a pagar"
2. createBooking() → pedido en BD (status: pending_payment, payment_status: pending)
3. POST /api/payments/preference → obtiene init_point de MP
4. window.location.href = init_point  (redirección a MP)
5. En MP, cliente elige pagar depósito (50%) o monto completo (100%)
6. MP redirige a back_url según resultado:
   ├── success → /agendar/confirmacion?order=DD-XXXX&status=approved
   ├── failure → /agendar/confirmacion?order=DD-XXXX&status=failure
   └── pending → /agendar/confirmacion?order=DD-XXXX&status=pending
7. Webhook /api/webhooks/mercadopago recibe notificación (asíncrono, puede llegar antes o después del redirect):
   ├── Depósito (50%) aprobado → status: pending, payment_status: partial, deposit_paid: true
   └── Total (100%) aprobado  → status: pending, payment_status: paid
8. Se registra transacción + order_history
9. Se envía email de confirmación al cliente

PÁGINA /agendar/confirmacion maneja ?status:
- "approved" → "¡Pago recibido! Tu pedido está confirmado. Recibirás un email con los detalles."
- "failure"  → "El pago no pudo procesarse. Tu pedido fue registrado. Contáctanos para coordinar."
              + botón "Reintentar pago" (llama a POST /api/payments/preference nuevamente)
              + botón WhatsApp
- "pending"  → "Tu pago está en proceso. Te notificaremos cuando se confirme."
- (sin status) → comportamiento actual (legacy, no debería ocurrir con nuevo flujo)
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

`pending_payment` es un **nuevo status** que se agrega a `ORDER_STATUS` en `lib/utils/constants.ts` y es compatible con el schema de BD existente (`orders.status VARCHAR(50)`). No requiere migración de columna.

| `status` del pedido | `payment_status` | Descripción |
|---|---|---|
| `pending_payment` | `pending` | Creado, redirigido a MP, esperando pago |
| `pending` | `partial` | Depósito pagado (50%), saldo pendiente |
| `pending` | `paid` | Pago completo (100%) |
| `pending` | `pending` | Pedido abandonado — admin contacta al cliente |

El status `pending_payment` **no se muestra en el panel de pedidos activos** por defecto (filtro excluye este status). Aparece en una vista separada "Pagos pendientes" para que el admin pueda hacer seguimiento.

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

// Errores
- 400 si orderId falta o paymentType inválido
- 404 si pedido no existe
- 400 si pedido no está en status 'pending_payment'
- 500 si falla Supabase o MP

// Lógica
1. Obtener pedido por orderId
2. Obtener deposit_percentage desde settings
   → Si no existe en BD → usar DEFAULT = 50 (y loguear warning)
3. Calcular monto:
   - 'deposit' → Math.round(total * depositPercentage / 100)  // CLP, sin decimales
   - 'full'    → total
4. Crear preferencia MP:
   - items: [{ title: "Pedido DeliDanis #DD-XXXX", unit_price: monto, quantity: 1, currency_id: "CLP" }]
   - external_reference: order_number  // formato DD-XXXX
   - back_urls:
       success: NEXT_PUBLIC_APP_URL/agendar/confirmacion?order=DD-XXXX&status=approved
       failure: NEXT_PUBLIC_APP_URL/agendar/confirmacion?order=DD-XXXX&status=failure
       pending: NEXT_PUBLIC_APP_URL/agendar/confirmacion?order=DD-XXXX&status=pending
   - auto_return: "approved"
   - notification_url: NEXT_PUBLIC_APP_URL/api/webhooks/mercadopago
5. Retornar { init_point, preference_id }
```

---

## POST /api/webhooks/mercadopago

```typescript
// MP envía: { type: "payment", data: { id: "123456" } }
1. Verificar x-signature (HMAC SHA256 con MERCADOPAGO_WEBHOOK_SECRET)
2. Si type !== "payment" → return 200 (ignorar otros eventos)
3. GET https://api.mercadopago.com/v1/payments/{id}
4. IDEMPOTENCIA: buscar pedido por payment_reference = paymentId
   - Si ya existe → return 200 (ya procesado, no duplicar)
5. Extraer external_reference → buscar pedido por order_number (formato DD-XXXX)
6. Si pedido no existe → log error, return 200
7. Si pedido payment_status === "paid" → return 200 (ya está pagado)
8. Según status del pago:
   - "approved":
     - Calcular si monto ≈ depósito o ≈ total
       (tolerancia: abs(pagado - esperado) <= 10 CLP, dado que CLP no tiene decimales)
     - Si monto ≈ depósito:
       → UPDATE orders SET status='pending', payment_status='partial',
         deposit_paid=true, deposit_amount=monto, payment_reference=paymentId
       → Si status era 'pending_payment': incrementar daily_capacity para event_date
     - Si monto ≈ total:
       → UPDATE orders SET status='pending', payment_status='paid',
         payment_reference=paymentId
       → Si status era 'pending_payment': incrementar daily_capacity para event_date
       → Si status era 'pending' (ya tenía depósito): NO incrementar (ya se contó)
     - Insertar en transactions:
       { type: 'income', category: 'order', amount: monto,
         reference_id: order.id, reference_type: 'order_payment',
         payment_method: 'mercadopago', transaction_date: today }
     - Insertar en order_history: { status: nuevo_status, notes: 'Pago confirmado vía MercadoPago' }
     - Enviar email de confirmación al cliente (template existente confirm-order)
   - "rejected" / "cancelled" / "refunded": log, no hacer nada
9. Retornar 200 OK siempre (MP reintenta si no recibe 200)
```

**Obtener MERCADOPAGO_WEBHOOK_SECRET:** En el panel de MP → Tus integraciones → Webhooks → crear webhook con URL `https://tudominio.com/api/webhooks/mercadopago` → MP muestra la clave secreta.

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

Mensaje WhatsApp pre-escrito (interpolado en frontend antes de abrir wa.me):
```
Hola {customer.first_name}, te compartimos el link de pago del saldo
de tu pedido {order_number} por {formatCurrency(balance)}:

{payment_url}

¿Tienes preguntas? Escríbenos 🎂
```
URL: `wa.me/56939282764?text=encodeURIComponent(mensaje)`

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
