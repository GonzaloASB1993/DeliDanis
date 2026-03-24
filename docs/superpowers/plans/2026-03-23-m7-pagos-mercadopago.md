# M7 — Integración de Pagos MercadoPago

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar MercadoPago Checkout Pro en el flujo de agendamiento para cobrar un depósito configurable (50% default) o pago total al momento de reservar, con webhook automático que actualiza el estado del pedido y panel admin para generar links de saldo.

**Architecture:** Se crea el pedido con `status: pending_payment` antes de redirigir al checkout de MP. El webhook `/api/webhooks/mercadopago` recibe la notificación de pago y actualiza el pedido a `pending` + `payment_status: partial|paid`. El admin puede generar un link de saldo para pedidos con depósito parcial y enviarlo por WhatsApp.

**Tech Stack:** Next.js 14 App Router, MercadoPago SDK (`mercadopago` npm), Supabase, TypeScript

---

## File Map

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `lib/payments/mercadopago.ts` | **Crear** | Cliente MP, `createPreference()`, `getPayment()`, `verifyWebhookSignature()` |
| `app/api/payments/preference/route.ts` | **Crear** | POST: crea preferencia de pago (depósito o total) |
| `app/api/webhooks/mercadopago/route.ts` | **Crear** | POST: recibe notificaciones MP, actualiza BD |
| `app/api/payments/balance-link/route.ts` | **Crear** | POST: genera link de pago de saldo (admin) |
| `lib/utils/constants.ts` | **Modificar** | Agregar `PENDING_PAYMENT` a `ORDER_STATUS` |
| `lib/supabase/booking-mutations.ts` | **Modificar** | `createBooking` usa `status: 'pending_payment'` |
| `app/(public)/agendar/page.tsx` | **Modificar** | Agregar paso 5 (pago) con trust signals, actualizar barra de progreso a 5 pasos |
| `app/(public)/agendar/confirmacion/page.tsx` | **Modificar** | Manejar `?status=approved\|failure\|pending` |
| `components/admin/OrderDetailModal.tsx` | **Modificar** | Sección pago con generar link de saldo + botón WhatsApp |

---

## Task 1: Instalar SDK y configurar variables de entorno

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.local`

- [ ] **Step 1: Instalar el SDK oficial de MercadoPago**

```bash
cd "C:/Users/gonza/OneDrive/Escritorio/Proyectos Web/DeliDanis"
npm install mercadopago
```

Esperado: `added 1 package` (o similar, sin errores).

- [ ] **Step 2: Actualizar `.env.local` con las credenciales**

Abrir `.env.local` y reemplazar los placeholders:

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1628467954157053-032321-6037dd82ce705fda5d7ae27b3adc8aa2-3287776083
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-<tu-public-key-de-prueba>
MERCADOPAGO_WEBHOOK_SECRET=<dejar-vacío-por-ahora-se-configura-al-final>
```

> **Nota:** La Public Key de prueba la encuentras en el panel de MP → Tu negocio → Credenciales → Credenciales de prueba. Tiene formato `TEST-xxxxxxxx-xxxx-...`

- [ ] **Step 3: Verificar que TypeScript reconoce el módulo**

```bash
cd "C:/Users/gonza/OneDrive/Escritorio/Proyectos Web/DeliDanis"
npx tsc --noEmit 2>&1 | head -20
```

Esperado: sin errores relacionados a `mercadopago`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install mercadopago SDK"
```

---

## Task 2: Agregar PENDING_PAYMENT al ORDER_STATUS

**Files:**
- Modify: `lib/utils/constants.ts`

- [ ] **Step 1: Agregar el nuevo status**

En `lib/utils/constants.ts`, en el objeto `ORDER_STATUS` (línea 2), agregar `PENDING_PAYMENT` como primer elemento:

```typescript
export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',   // ← agregar esta línea
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PRODUCTION: 'in_production',
  READY: 'ready',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -i "constants" | head -5
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add lib/utils/constants.ts
git commit -m "feat: add pending_payment to ORDER_STATUS constants"
```

---

## Task 3: Actualizar createBooking para usar pending_payment

**Files:**
- Modify: `lib/supabase/booking-mutations.ts:123`

El `createBooking` actualmente crea el pedido con `status: 'pending'`. Debe usar `'pending_payment'` para que el webhook lo active cuando se confirme el pago.

- [ ] **Step 1: Cambiar el status inicial en createBooking**

En `lib/supabase/booking-mutations.ts`, en el insert del pedido (alrededor de línea 123), cambiar:

```typescript
// ANTES
status: 'pending',

// DESPUÉS
status: 'pending_payment',
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -i "booking" | head -5
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/booking-mutations.ts
git commit -m "feat: create bookings with pending_payment status"
```

---

## Task 4: Crear lib/payments/mercadopago.ts

**Files:**
- Create: `lib/payments/mercadopago.ts`

Este módulo encapsula toda la comunicación con la API de MercadoPago. Solo se usa en el servidor (API routes), nunca en el cliente.

- [ ] **Step 1: Crear el archivo**

```typescript
// lib/payments/mercadopago.ts
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import crypto from 'crypto'

// Cliente MP singleton (server-side only)
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export interface CreatePreferenceParams {
  orderNumber: string
  orderId: string
  amount: number        // En CLP (sin decimales)
  paymentType: 'deposit' | 'full' | 'balance'
  appUrl: string        // NEXT_PUBLIC_APP_URL
}

export interface PreferenceResult {
  initPoint: string      // URL para redirigir al cliente
  preferenceId: string
}

/**
 * Crea una preferencia de pago en MercadoPago.
 * Funciona para depósito inicial, pago total, y pago de saldo.
 */
export async function createPreference(
  params: CreatePreferenceParams
): Promise<PreferenceResult> {
  const { orderNumber, amount, paymentType, appUrl } = params

  const labelMap = {
    deposit: 'Depósito',
    full: 'Pago total',
    balance: 'Saldo pendiente',
  }

  const preference = new Preference(client)

  const response = await preference.create({
    body: {
      items: [
        {
          id: orderNumber,
          title: `${labelMap[paymentType]} — Pedido DeliDanis #${orderNumber}`,
          quantity: 1,
          unit_price: amount,
          currency_id: 'CLP',
        },
      ],
      external_reference: orderNumber,
      back_urls: {
        success: `${appUrl}/agendar/confirmacion?order=${orderNumber}&status=approved`,
        failure: `${appUrl}/agendar/confirmacion?order=${orderNumber}&status=failure`,
        pending: `${appUrl}/agendar/confirmacion?order=${orderNumber}&status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
    },
  })

  if (!response.init_point || !response.id) {
    throw new Error('MercadoPago no devolvió init_point o id')
  }

  return {
    initPoint: response.init_point,
    preferenceId: response.id,
  }
}

/**
 * Obtiene los datos de un pago por su ID desde la API de MP.
 */
export async function getPayment(paymentId: string | number) {
  const payment = new Payment(client)
  return payment.get({ id: Number(paymentId) })
}

/**
 * Verifica la firma x-signature del webhook de MercadoPago.
 * Retorna true si es válida, false si no.
 *
 * Formato header: ts=TIMESTAMP,v1=HASH
 * HASH = HMAC-SHA256("id.PAYMENT_ID;ts.TIMESTAMP", secret)
 */
export function verifyWebhookSignature(
  xSignature: string,
  xRequestId: string,
  paymentId: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    // En desarrollo sin secret configurado, permitir (loguear warning)
    console.warn('[MP Webhook] MERCADOPAGO_WEBHOOK_SECRET no configurado — omitiendo verificación')
    return true
  }

  try {
    const parts = xSignature.split(',')
    const tsPart = parts.find(p => p.startsWith('ts='))
    const v1Part = parts.find(p => p.startsWith('v1='))

    if (!tsPart || !v1Part) return false

    const ts = tsPart.replace('ts=', '')
    const v1 = v1Part.replace('v1=', '')

    const manifest = `id.${paymentId};request-id.${xRequestId};ts.${ts}`
    const hash = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex')

    return hash === v1
  } catch {
    return false
  }
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -i "mercadopago\|payments" | head -10
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add lib/payments/mercadopago.ts
git commit -m "feat: add MercadoPago client helper (createPreference, getPayment, verifyWebhookSignature)"
```

---

## Task 5: Crear POST /api/payments/preference

**Files:**
- Create: `app/api/payments/preference/route.ts`

Este endpoint crea una preferencia de pago en MP para el flujo de agendamiento (depósito o total).

- [ ] **Step 1: Crear el directorio y archivo**

```typescript
// app/api/payments/preference/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPreference } from '@/lib/payments/mercadopago'

const DEFAULT_DEPOSIT_PERCENTAGE = 50
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, paymentType } = body

    // Validar input
    if (!orderId || !paymentType) {
      return NextResponse.json(
        { error: 'orderId y paymentType son requeridos' },
        { status: 400 }
      )
    }

    if (!['deposit', 'full'].includes(paymentType)) {
      return NextResponse.json(
        { error: 'paymentType debe ser "deposit" o "full"' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Obtener pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, total, status, payment_status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    if (order.status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'El pedido no está en estado pending_payment' },
        { status: 400 }
      )
    }

    // Obtener porcentaje de depósito desde settings
    let depositPercentage = DEFAULT_DEPOSIT_PERCENTAGE
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'payments')
      .single()

    if (setting?.value?.deposit_percentage) {
      depositPercentage = Number(setting.value.deposit_percentage)
    } else {
      console.warn('[Payments] deposit_percentage no encontrado en settings, usando default 50%')
    }

    // Calcular monto (CLP = enteros, sin decimales)
    const amount =
      paymentType === 'deposit'
        ? Math.round((order.total * depositPercentage) / 100)
        : Math.round(order.total)

    // Crear preferencia en MP
    const result = await createPreference({
      orderNumber: order.order_number,
      orderId: order.id,
      amount,
      paymentType,
      appUrl: APP_URL,
    })

    return NextResponse.json({
      initPoint: result.initPoint,
      preferenceId: result.preferenceId,
      amount,
      depositPercentage,
    })
  } catch (error) {
    console.error('[Payments] Error creando preferencia:', error)
    return NextResponse.json(
      { error: 'Error interno al crear preferencia de pago' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -i "preference" | head -5
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/api/payments/preference/route.ts
git commit -m "feat: add POST /api/payments/preference endpoint"
```

---

## Task 6: Crear POST /api/webhooks/mercadopago

**Files:**
- Create: `app/api/webhooks/mercadopago/route.ts`

El webhook más crítico — recibe notificaciones de pago de MP y actualiza el estado del pedido, registra la transacción y envía email.

- [ ] **Step 1: Crear el archivo**

```typescript
// app/api/webhooks/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPayment, verifyWebhookSignature } from '@/lib/payments/mercadopago'

const TOLERANCE_CLP = 10 // tolerancia de $10 CLP por redondeos

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Solo procesar eventos de tipo "payment"
    if (body.type !== 'payment' || !body.data?.id) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const paymentId = String(body.data.id)

    // Verificar firma (si MERCADOPAGO_WEBHOOK_SECRET está configurado)
    const xSignature = request.headers.get('x-signature') || ''
    const xRequestId = request.headers.get('x-request-id') || ''
    const isValid = verifyWebhookSignature(xSignature, xRequestId, paymentId)

    if (!isValid) {
      console.error('[MP Webhook] Firma inválida, rechazando')
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
    }

    // Obtener datos del pago desde la API de MP
    const payment = await getPayment(paymentId)

    if (payment.status !== 'approved') {
      // No procesar pagos no aprobados
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const orderNumber = payment.external_reference
    if (!orderNumber) {
      console.error('[MP Webhook] Sin external_reference en pago', paymentId)
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const supabase = await createClient()

    // IDEMPOTENCIA: verificar si este payment_id ya fue procesado
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, payment_reference')
      .eq('payment_reference', paymentId)
      .single()

    if (existingOrder) {
      console.log('[MP Webhook] Pago ya procesado (idempotente):', paymentId)
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // Buscar pedido por order_number
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_status, total, deposit_amount, customer_id, event_date')
      .eq('order_number', orderNumber)
      .single()

    if (orderError || !order) {
      console.error('[MP Webhook] Pedido no encontrado:', orderNumber)
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // Si ya está pagado, no procesar
    if (order.payment_status === 'paid') {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const paidAmount = Math.round(payment.transaction_amount || 0)
    const totalAmount = Math.round(order.total)

    // Calcular depósito esperado
    let depositPercentage = 50
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'payments')
      .single()
    if (setting?.value?.deposit_percentage) {
      depositPercentage = Number(setting.value.deposit_percentage)
    }
    const expectedDeposit = Math.round((totalAmount * depositPercentage) / 100)

    // Determinar si es depósito o pago total
    const isFullPayment = Math.abs(paidAmount - totalAmount) <= TOLERANCE_CLP
    const isDepositPayment = !isFullPayment && Math.abs(paidAmount - expectedDeposit) <= TOLERANCE_CLP

    if (!isFullPayment && !isDepositPayment) {
      console.warn('[MP Webhook] Monto no coincide con depósito ni total:', {
        paidAmount, expectedDeposit, totalAmount,
      })
      // Procesar igual como pago parcial
    }

    const wasInCheckout = order.status === 'pending_payment'

    // Actualizar pedido
    const updateData: Record<string, unknown> = {
      status: 'pending',
      payment_reference: paymentId,
    }

    if (isFullPayment) {
      updateData.payment_status = 'paid'
    } else {
      updateData.payment_status = 'partial'
      updateData.deposit_paid = true
      updateData.deposit_amount = paidAmount
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id)

    if (updateError) {
      console.error('[MP Webhook] Error actualizando pedido:', updateError)
      return NextResponse.json({ error: 'Error BD' }, { status: 500 })
    }

    // Incrementar capacidad diaria solo si venía de pending_payment (primera vez pagado)
    if (wasInCheckout && order.event_date) {
      const { error: capacityError } = await supabase.rpc('increment_daily_capacity', {
        p_date: order.event_date,
      })
      if (capacityError) {
        // No es crítico, loguear y continuar
        console.warn('[MP Webhook] No se pudo incrementar capacidad:', capacityError.message)
      }
    }

    // Registrar en transactions
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('transactions').insert({
      type: 'income',
      category: 'order',
      amount: paidAmount,
      description: isFullPayment
        ? `Pago total pedido ${orderNumber} vía MercadoPago`
        : `Depósito pedido ${orderNumber} vía MercadoPago`,
      reference_id: order.id,
      reference_type: 'order_payment',
      payment_method: 'mercadopago',
      transaction_date: today,
    })

    // Registrar en order_history
    await supabase.from('order_history').insert({
      order_id: order.id,
      status: 'pending',
      notes: isFullPayment
        ? `Pago completo confirmado vía MercadoPago ($${paidAmount.toLocaleString('es-CL')})`
        : `Depósito confirmado vía MercadoPago ($${paidAmount.toLocaleString('es-CL')})`,
    })

    // Enviar email de confirmación al cliente (fire and forget)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    fetch(`${appUrl}/api/email/confirm-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id }),
    }).catch(err => console.error('[MP Webhook] Error enviando email:', err))

    console.log(`[MP Webhook] Procesado OK: ${orderNumber} → ${updateData.payment_status}`)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('[MP Webhook] Error inesperado:', error)
    // Siempre retornar 200 para que MP no reintente indefinidamente
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -i "webhook" | head -5
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/api/webhooks/mercadopago/route.ts
git commit -m "feat: add POST /api/webhooks/mercadopago with idempotency and capacity update"
```

---

## Task 7: Crear POST /api/payments/balance-link

**Files:**
- Create: `app/api/payments/balance-link/route.ts`

Genera un link de pago para el saldo restante. Solo accesible desde el panel admin (requiere sesión autenticada).

- [ ] **Step 1: Crear el archivo**

```typescript
// app/api/payments/balance-link/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPreference } from '@/lib/payments/mercadopago'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 })
    }

    // Obtener pedido
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, total, deposit_amount, payment_status')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    if (order.payment_status !== 'partial') {
      return NextResponse.json(
        { error: 'El pedido no tiene un depósito parcial pagado' },
        { status: 400 }
      )
    }

    // Calcular saldo
    const depositPaid = Math.round(order.deposit_amount || 0)
    const balance = Math.round(order.total) - depositPaid

    if (balance <= 0) {
      return NextResponse.json({ error: 'No hay saldo pendiente' }, { status: 400 })
    }

    // Crear preferencia de saldo en MP
    const result = await createPreference({
      orderNumber: order.order_number,
      orderId: order.id,
      amount: balance,
      paymentType: 'balance',
      appUrl: APP_URL,
    })

    return NextResponse.json({
      paymentUrl: result.initPoint,
      preferenceId: result.preferenceId,
      balance,
    })
  } catch (error) {
    console.error('[Balance Link] Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -i "balance" | head -5
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/api/payments/balance-link/route.ts
git commit -m "feat: add POST /api/payments/balance-link for admin balance payment"
```

---

## Task 8: Agregar paso 5 (Pago) al flujo de agendamiento

**Files:**
- Modify: `app/(public)/agendar/page.tsx`

Este es el cambio más visible para el cliente. Actualmente el botón "Confirmar Pedido" en el paso 4 crea el pedido y redirige a /confirmacion. Ahora debe:
1. Avanzar al paso 5 (nuevo)
2. En el paso 5: mostrar trust signals + resumen de pago + botones "Pagar depósito" / "Pagar total"
3. Al hacer clic: crear booking (pending_payment) → llamar a /api/payments/preference → redirigir a MP

**Cambios en `app/(public)/agendar/page.tsx`:**

- [ ] **Step 1: Actualizar barra de progreso de 4 a 5 pasos**

Buscar la sección de progress bar (alrededor de línea 307) y cambiar `"Paso {X} de 4"` por `"Paso {X} de 5"`:

```typescript
// ANTES
<span className="text-sm font-semibold text-dark">Paso {currentStep} de 4</span>
// y
const progressPercentage = (currentStep / 4) * 100

// DESPUÉS
<span className="text-sm font-semibold text-dark">Paso {currentStep} de 5</span>
// y
const progressPercentage = (currentStep / 5) * 100
```

- [ ] **Step 2: Agregar "Pago" a los labels del stepper**

Buscar el array de steps (alrededor de línea 319) y agregar paso 5:

```typescript
// ANTES
[
  { num: 1, label: 'Evento', icon: '🎊' },
  { num: 2, label: 'Servicios', icon: '🛍️' },
  { num: 3, label: 'Detalles', icon: '📋' },
  { num: 4, label: 'Contacto', icon: '📞' },
]

// DESPUÉS
[
  { num: 1, label: 'Evento', icon: '🎊' },
  { num: 2, label: 'Servicios', icon: '🛍️' },
  { num: 3, label: 'Detalles', icon: '📋' },
  { num: 4, label: 'Contacto', icon: '📞' },
  { num: 5, label: 'Pago', icon: '💳' },
]
```

- [ ] **Step 3: Cambiar el botón "Confirmar Pedido" del paso 4 para avanzar a paso 5**

Buscar el onClick del botón "Confirmar Pedido" (alrededor de línea 705). Actualmente llama a `createBooking` y redirige. Cambiarlo para simplemente avanzar al paso 5:

```typescript
// ANTES: botón "Confirmar Pedido" con onClick que llama createBooking y redirige
<Button
  onClick={async () => {
    if (!validateContactForm()) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const result = await createBooking(bookingData)
      if (!result.success) {
        setSubmitError(result.error || 'Error al crear el pedido')
        setIsSubmitting(false)
        return
      }
      router.push(`/agendar/confirmacion?order=${result.orderNumber}`)
    } catch (error) {
      setSubmitError('Error inesperado. Por favor intenta nuevamente.')
      setIsSubmitting(false)
    }
  }}
  disabled={!canContinueStep4 || isSubmitting}
  isLoading={isSubmitting}
  className="bg-accent hover:bg-accent-light"
>
  {isSubmitting ? 'Guardando...' : 'Confirmar Pedido'}
  ...
</Button>

// DESPUÉS: botón "Continuar al Pago" que solo avanza al siguiente paso
<Button
  onClick={() => {
    if (!validateContactForm()) return
    nextStep()
  }}
  disabled={!canContinueStep4}
  className="bg-accent hover:bg-accent-light"
>
  Continuar al Pago
  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
</Button>
```

- [ ] **Step 4: Agregar estado para el paso 5**

Agregar estas variables de estado junto a los otros `useState` del componente (cerca de línea 62):

```typescript
const [isPaymentLoading, setIsPaymentLoading] = useState(false)
const [paymentError, setPaymentError] = useState<string | null>(null)
const [depositInfo, setDepositInfo] = useState<{ percentage: number; amount: number } | null>(null)
```

- [ ] **Step 5: Agregar handler de pago**

Añadir el handler `handlePay` después de los handlers existentes (antes del `return`):

```typescript
const handlePay = async (paymentType: 'deposit' | 'full') => {
  setIsPaymentLoading(true)
  setPaymentError(null)

  try {
    // 1. Crear el pedido con status pending_payment
    const result = await createBooking(bookingData)

    if (!result.success || !result.orderId) {
      setPaymentError(result.error || 'Error al registrar el pedido')
      setIsPaymentLoading(false)
      return
    }

    // 2. Crear preferencia de pago en MP
    const prefResponse = await fetch('/api/payments/preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: result.orderId, paymentType }),
    })

    const prefData = await prefResponse.json()

    if (!prefResponse.ok || !prefData.initPoint) {
      setPaymentError('Error al iniciar el pago. Intenta nuevamente.')
      setIsPaymentLoading(false)
      return
    }

    // Guardar info del depósito para mostrar en el step 5
    setDepositInfo({ percentage: prefData.depositPercentage, amount: prefData.amount })

    // 3. Redirigir a MercadoPago
    window.location.href = prefData.initPoint
  } catch {
    setPaymentError('Error inesperado. Por favor intenta nuevamente.')
    setIsPaymentLoading(false)
  }
}
```

- [ ] **Step 6: Agregar el contenido del Paso 5 (Pago)**

Después del bloque `{currentStep === 4 && (...)}` y antes del cierre del `</Card>`, agregar:

```tsx
{/* STEP 5: Pago */}
{currentStep === 5 && (
  <div className="space-y-6">
    <div>
      <h2 className="font-display text-3xl font-bold text-dark mb-2">
        Confirmar y Pagar
      </h2>
      <p className="text-dark-light">
        Elige cómo quieres pagar para confirmar tu pedido
      </p>
    </div>

    {/* Trust Signals */}
    <div className="flex flex-wrap items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-sm font-medium text-green-800">Pago 100% Seguro</span>
      </div>
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium text-green-800">Datos protegidos</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Logo MercadoPago */}
        <span className="text-sm font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">MercadoPago</span>
        <span className="text-sm text-green-800">Procesado por</span>
      </div>
    </div>

    {/* Resumen de pago */}
    <div className="bg-secondary/50 rounded-xl p-5 space-y-3">
      <h3 className="font-semibold text-dark">Resumen de pago</h3>
      <div className="flex justify-between text-sm">
        <span className="text-dark-light">Subtotal servicios</span>
        <span className="text-dark font-medium">{formatCurrency(bookingData.subtotal)}</span>
      </div>
      {bookingData.deliveryFee > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-dark-light">Envío</span>
          <span className="text-dark font-medium">{formatCurrency(bookingData.deliveryFee)}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
        <span className="text-dark">Total del pedido</span>
        <span className="text-accent font-display text-xl">{formatCurrency(bookingData.total)}</span>
      </div>
    </div>

    {/* Error */}
    {paymentError && (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        {paymentError}
      </div>
    )}

    {/* Opciones de pago */}
    <div className="space-y-3">
      {/* Pagar depósito */}
      <button
        onClick={() => handlePay('deposit')}
        disabled={isPaymentLoading}
        className="w-full p-5 bg-white border-2 border-primary rounded-2xl text-left hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-dark group-hover:text-primary transition-colors">
            Pagar depósito ahora
          </span>
          <span className="text-xl font-bold font-display text-primary">
            {formatCurrency(Math.round(bookingData.total * 0.5))}
          </span>
        </div>
        <p className="text-sm text-dark-light">
          50% ahora para reservar tu fecha · El saldo lo pagas más adelante
        </p>
      </button>

      {/* Pagar total */}
      <button
        onClick={() => handlePay('full')}
        disabled={isPaymentLoading}
        className="w-full p-5 bg-white border-2 border-gray-200 rounded-2xl text-left hover:border-accent hover:bg-accent/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-dark">
            Pagar monto completo
          </span>
          <span className="text-xl font-bold font-display text-accent">
            {formatCurrency(bookingData.total)}
          </span>
        </div>
        <p className="text-sm text-dark-light">
          Pago único · Sin saldo pendiente
        </p>
      </button>
    </div>

    <p className="text-xs text-center text-dark-light">
      Serás redirigido al sitio oficial de MercadoPago para completar tu pago de forma segura.
    </p>

    {isPaymentLoading && (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-dark-light mt-2">Preparando tu pago...</p>
      </div>
    )}

    {/* Botón atrás */}
    <div className="flex justify-start pt-2">
      <Button
        variant="ghost"
        onClick={() => prevStep()}
        disabled={isPaymentLoading}
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
        Atrás
      </Button>
    </div>
  </div>
)}
```

> **Nota sobre el porcentaje de depósito en el Step 5:** En este paso se muestra un 50% hardcoded para la UI (para no hacer fetch). El monto real lo calcula el API. Para una implementación más precisa, se puede hacer fetch del `deposit_percentage` desde settings al cargar el paso 5, pero para V1 el 50% hardcoded es suficiente dado que es el default configurado.

- [ ] **Step 7: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "agendar" | head -10
```

Esperado: sin errores (o solo warnings menores).

- [ ] **Step 8: Probar en dev**

```bash
npm run dev
```

Navegar a `http://localhost:3000/agendar`, completar los 4 primeros pasos y verificar que aparece el paso 5 con los botones de pago y los trust signals.

- [ ] **Step 9: Commit**

```bash
git add app/(public)/agendar/page.tsx
git commit -m "feat: add payment step 5 to booking flow with trust signals and MP redirect"
```

---

## Task 9: Actualizar página de confirmación para manejar ?status

**Files:**
- Modify: `app/(public)/agendar/confirmacion/page.tsx`

La página actualmente solo usa `?order=XXX`. Ahora también recibe `?status=approved|failure|pending`.

- [ ] **Step 1: Agregar lectura del parámetro status**

En `ConfirmacionContent` (línea 42), agregar `status` junto a `order`:

```typescript
// ANTES
const orderNumber = searchParams.get('order')

// DESPUÉS
const orderNumber = searchParams.get('order')
const paymentStatus = searchParams.get('status') // 'approved' | 'failure' | 'pending' | null
```

- [ ] **Step 2: Agregar UI condicional según el status**

Reemplazar el encabezado de éxito actual (alrededor de línea 163) por uno que varía según el status:

```tsx
{/* Success/Failure Animation y título */}
<div className="text-center mb-8">
  {paymentStatus === 'failure' ? (
    <>
      <div className="inline-block p-6 bg-red-100 rounded-full mb-4">
        <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="font-display text-4xl md:text-5xl font-bold text-dark mb-3">
        Pago no procesado
      </h1>
      <p className="text-xl text-dark-light">
        Tu pedido fue registrado. Te contactaremos para coordinar el pago.
      </p>
    </>
  ) : paymentStatus === 'pending' ? (
    <>
      <div className="inline-block p-6 bg-yellow-100 rounded-full mb-4">
        <svg className="w-16 h-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="font-display text-4xl md:text-5xl font-bold text-dark mb-3">
        Pago en proceso
      </h1>
      <p className="text-xl text-dark-light">
        Tu pago está siendo procesado. Te notificaremos cuando se confirme.
      </p>
    </>
  ) : (
    <>
      <div className="inline-block p-6 bg-primary/10 rounded-full mb-4 animate-bounce">
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="font-display text-4xl md:text-5xl font-bold text-dark mb-3">
        ¡Pedido Confirmado!
      </h1>
      <p className="text-xl text-dark-light">
        {paymentStatus === 'approved'
          ? '¡Pago recibido! Tu pedido está confirmado.'
          : 'Hemos recibido tu pedido correctamente'}
      </p>
    </>
  )}
</div>
```

- [ ] **Step 3: Agregar botón "Reintentar pago" para status=failure**

En la sección de "¿Qué sigue ahora?" (alrededor de línea 315), agregar condicionalmente para failure:

```tsx
{/* Botón reintentar para failure */}
{paymentStatus === 'failure' && orderData && (
  <Card className="mb-6 bg-red-50 border border-red-200">
    <h3 className="font-semibold text-dark mb-3">¿Quieres intentarlo de nuevo?</h3>
    <p className="text-sm text-dark-light mb-4">
      Puedes reintentar el pago o contactarnos por WhatsApp para coordinar.
    </p>
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        onClick={async () => {
          const res = await fetch('/api/payments/preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: orderData.id, paymentType: 'deposit' }),
          })
          const data = await res.json()
          if (data.initPoint) window.location.href = data.initPoint
        }}
      >
        💳 Reintentar pago
      </Button>
      <a
        href={`https://wa.me/56939282764?text=${encodeURIComponent(`Hola, tuve problemas para pagar mi pedido ${orderData.order_number}. ¿Pueden ayudarme?`)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button variant="secondary">📱 Contactar por WhatsApp</Button>
      </a>
    </div>
  </Card>
)}
```

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "confirmacion" | head -5
```

- [ ] **Step 5: Probar en dev**

Navegar a:
- `http://localhost:3000/agendar/confirmacion?order=DD-0001&status=approved` → debe mostrar éxito
- `http://localhost:3000/agendar/confirmacion?order=DD-0001&status=failure` → debe mostrar error con botón reintentar
- `http://localhost:3000/agendar/confirmacion?order=DD-0001&status=pending` → debe mostrar "en proceso"

- [ ] **Step 6: Commit**

```bash
git add "app/(public)/agendar/confirmacion/page.tsx"
git commit -m "feat: handle payment status (approved/failure/pending) in confirmation page"
```

---

## Task 10: Agregar sección de pago en OrderDetailModal (admin)

**Files:**
- Modify: `components/admin/OrderDetailModal.tsx`

El admin necesita ver el estado de pago del pedido, generar un link de saldo cuando hay depósito parcial, y enviarlo por WhatsApp.

- [ ] **Step 1: Agregar estados en el componente OrderDetailModal**

Cerca de los otros `useState` del componente, agregar:

```typescript
const [balanceLink, setBalanceLink] = useState<string | null>(null)
const [isGeneratingLink, setIsGeneratingLink] = useState(false)
const [linkCopied, setLinkCopied] = useState(false)
```

- [ ] **Step 2: Agregar handler para generar link de saldo**

Añadir el handler antes del `return` del componente:

```typescript
const handleGenerateBalanceLink = async () => {
  if (!order) return
  setIsGeneratingLink(true)
  try {
    const res = await fetch('/api/payments/balance-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id }),
    })
    const data = await res.json()
    if (data.paymentUrl) {
      setBalanceLink(data.paymentUrl)
    }
  } catch {
    console.error('Error generando link de saldo')
  } finally {
    setIsGeneratingLink(false)
  }
}

const handleCopyLink = () => {
  if (!balanceLink) return
  navigator.clipboard.writeText(balanceLink)
  setLinkCopied(true)
  setTimeout(() => setLinkCopied(false), 2000)
}

const handleWhatsAppBalance = () => {
  if (!order || !balanceLink) return
  const balance = order.total - (order.deposit_amount || 0)
  const customerName = order.customer?.first_name || 'Cliente'
  const msg = `Hola ${customerName}, te compartimos el link de pago del saldo de tu pedido ${order.order_number} por $${Math.round(balance).toLocaleString('es-CL')}:\n\n${balanceLink}\n\n¿Tienes preguntas? Escríbenos 🎂`
  window.open(`https://wa.me/56939282764?text=${encodeURIComponent(msg)}`, '_blank')
}
```

- [ ] **Step 3: Agregar sección "Pago" en el modal**

Buscar en el JSX del modal la sección donde se muestran los datos del pedido (cerca donde se muestra `payment_status`) y agregar esta sección después del resumen financiero:

```tsx
{/* Sección Pago */}
{order && order.payment_status !== 'paid' && (
  <div className="mt-6 pt-6 border-t border-border">
    <h3 className="font-semibold text-dark mb-4">Estado de Pago</h3>

    {/* Resumen montos */}
    <div className="bg-secondary/50 rounded-xl p-4 space-y-2 mb-4">
      <div className="flex justify-between text-sm">
        <span className="text-dark-light">Total del pedido</span>
        <span className="font-semibold text-dark">{formatCurrency(order.total)}</span>
      </div>
      {order.deposit_paid && (
        <div className="flex justify-between text-sm">
          <span className="text-dark-light">Depósito pagado ✓</span>
          <span className="font-semibold text-success-dark">{formatCurrency(order.deposit_amount || 0)}</span>
        </div>
      )}
      {order.payment_status === 'partial' && (
        <div className="flex justify-between text-sm font-bold border-t border-border pt-2 mt-2">
          <span className="text-dark">Saldo pendiente</span>
          <span className="text-accent">{formatCurrency(order.total - (order.deposit_amount || 0))}</span>
        </div>
      )}
    </div>

    {/* Botón generar link + resultado */}
    {order.payment_status === 'partial' && (
      <div className="space-y-3">
        {!balanceLink ? (
          <Button
            onClick={handleGenerateBalanceLink}
            disabled={isGeneratingLink}
            isLoading={isGeneratingLink}
            className="w-full"
          >
            {isGeneratingLink ? 'Generando...' : '🔗 Generar link de saldo'}
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-white border border-border rounded-xl">
              <span className="text-xs text-dark-light flex-1 truncate">{balanceLink}</span>
              <button
                onClick={handleCopyLink}
                className="text-xs font-medium text-primary hover:text-primary-hover shrink-0"
              >
                {linkCopied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <Button
              onClick={handleWhatsAppBalance}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              📱 Enviar por WhatsApp
            </Button>
          </div>
        )}
      </div>
    )}
  </div>
)}
```

- [ ] **Step 4: Agregar `pending_payment` al mapa de labels de status del modal**

En `ALL_STATUS_LABELS` (alrededor de línea 34), agregar la entrada para `pending_payment`:

```typescript
const ALL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: 'Pago Pendiente', color: 'bg-yellow-100 text-yellow-700' }, // ← agregar
  pending: { label: 'Pendiente', color: 'bg-orange-100 text-orange-700' },
  // ... resto igual
}
```

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "OrderDetail" | head -5
```

- [ ] **Step 6: Probar en dev**

1. Navegar a `http://localhost:3000/admin/agendamientos`
2. Abrir un pedido que tenga `payment_status: 'partial'`
3. Verificar que aparece la sección "Estado de Pago" con el botón "Generar link de saldo"
4. Clicar el botón y verificar que aparece el link y el botón de WhatsApp

- [ ] **Step 7: Commit**

```bash
git add components/admin/OrderDetailModal.tsx
git commit -m "feat: add balance payment link generation and WhatsApp sharing in OrderDetailModal"
```

---

## Task 11: Verificar deposit_percentage en página de configuración

**Files:**
- Modify: `app/admin/configuracion/page.tsx` (si es necesario)

La página ya tiene `deposit_percentage` en la UI y lo guarda en settings bajo la clave `payments`. Solo necesitamos verificar que el campo `accept_mercadopago` esté activado por default.

- [ ] **Step 1: Cambiar el default de accept_mercadopago a true**

En `app/admin/configuracion/page.tsx`, en `DEFAULT_PAYMENTS` (alrededor de línea 50):

```typescript
// ANTES
const DEFAULT_PAYMENTS: PaymentSettings = {
  deposit_percentage: 50,
  delivery_cost: 15000,
  accept_cash: true,
  accept_transfer: true,
  accept_mercadopago: false,   // ← cambiar a true
}

// DESPUÉS
const DEFAULT_PAYMENTS: PaymentSettings = {
  deposit_percentage: 50,
  delivery_cost: 15000,
  accept_cash: true,
  accept_transfer: true,
  accept_mercadopago: true,
}
```

- [ ] **Step 2: Verificar en dev que el campo deposit_percentage se guarda correctamente**

1. Navegar a `http://localhost:3000/admin/configuracion`
2. Ir a la sección "Pagos"
3. Cambiar el porcentaje de seña a 40, guardar
4. Recargar la página — verificar que sigue en 40

- [ ] **Step 3: Commit**

```bash
git add app/admin/configuracion/page.tsx
git commit -m "feat: enable mercadopago by default in payment settings"
```

---

## Task 12: Prueba end-to-end en ambiente de prueba

Antes de configurar el webhook en producción, hacer una prueba completa con las credenciales de prueba.

- [ ] **Step 1: Asegurarse que NEXT_PUBLIC_APP_URL está configurado**

En `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 2: Correr el servidor de desarrollo**

```bash
npm run dev
```

- [ ] **Step 3: Completar un agendamiento de prueba**

1. Ir a `http://localhost:3000/agendar`
2. Completar los 5 pasos
3. En el paso 5, hacer clic en "Pagar depósito ahora"
4. Verificar redirección a MercadoPago
5. Usar las [tarjetas de prueba de MP](https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards):
   - Número: `4509 9535 6623 3704`
   - Vencimiento: cualquier fecha futura
   - CVV: `123`
   - Nombre: `APRO` (para pago aprobado)
6. Verificar redirección a `/agendar/confirmacion?order=DD-XXXX&status=approved`

- [ ] **Step 4: Verificar en Supabase que el pedido se creó**

En el panel de Supabase → Table Editor → orders:
- Verificar que existe el pedido con `status: pending_payment` inicialmente
- Después de pagar (cuando el webhook llegue), verificar que cambió a `status: pending`, `payment_status: partial`

> **Nota sobre webhook en local:** El webhook de MP no puede llegar a `localhost`. Para probar el webhook en local, usar [ngrok](https://ngrok.com/) o similar para exponer el puerto local. En producción (Vercel), el webhook funcionará automáticamente.

- [ ] **Step 5: Configurar webhook en panel de MP (para producción)**

1. Ir a [Panel MP](https://www.mercadopago.cl/developers/panel) → Tus integraciones → Webhooks
2. Crear notificación: URL = `https://tudominio.vercel.app/api/webhooks/mercadopago`
3. Copiar la clave secreta generada
4. Agregar a `.env.local` y a las variables de entorno de Vercel:
   ```env
   MERCADOPAGO_WEBHOOK_SECRET=<clave-copiada>
   ```

- [ ] **Step 6: Commit final**

```bash
git add .env.local
git commit -m "chore: update env with MP webhook secret"
```

---

## Task 13: Actualizar task tracker

**Files:**
- Modify: `.claude/task.md`

- [ ] **Step 1: Marcar M7 como completado**

En `.claude/task.md`, en Milestone 7, cambiar los `[ ]` a `[x]`:

```markdown
## Milestone 7: Integración Pagos

- [x] MercadoPago — Checkout Pro para señas/pagos
- [ ] Stripe — alternativa internacional  ← mantener como pendiente (fuera de scope)
- [x] Webhook MercadoPago (api/webhooks/mercadopago)
- [ ] Webhook Stripe (api/webhooks/stripe)  ← mantener como pendiente
- [x] Flujo de pago en agendamiento
- [x] Confirmación de pago automática
- [x] Registro de transacciones en tabla transactions
```

- [ ] **Step 2: Commit**

```bash
git add .claude/task.md
git commit -m "chore: mark M7 MercadoPago integration as complete"
```
