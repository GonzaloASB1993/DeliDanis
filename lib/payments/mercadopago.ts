// lib/payments/mercadopago.ts
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import crypto from 'crypto'

// Client MP singleton (server-side only)
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

  // Removed debug console.logs — appUrl is config, not sensitive,
  // but verbose URL logging clutters production logs unnecessarily.
  const response = await preference.create({
    body: {
      items: [
        {
          id: orderNumber,
          title: `${labelMap[paymentType]} — Pedido DeliDanis #${orderNumber}`,
          description: `Pastelería para eventos — ${labelMap[paymentType]} pedido #${orderNumber}`,
          category_id: 'food_and_drink',
          quantity: 1,
          unit_price: amount,
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
 * HASH = HMAC-SHA256("id.PAYMENT_ID;request-id.X_REQUEST_ID;ts.TIMESTAMP", secret)
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
