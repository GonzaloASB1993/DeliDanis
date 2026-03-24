import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
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

    // Verificar firma
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
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const orderNumber = payment.external_reference
    if (!orderNumber) {
      console.error('[MP Webhook] Sin external_reference en pago', paymentId)
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const supabase = await createServerSupabaseClient()

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

    // Obtener porcentaje de depósito
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

    // Incrementar capacidad diaria solo si venía de pending_payment
    if (wasInCheckout && order.event_date) {
      try {
        const { error: capacityError } = await supabase.rpc('increment_daily_capacity', {
          p_date: order.event_date,
        })
        if (capacityError) {
          console.warn('[MP Webhook] No se pudo incrementar capacidad:', capacityError.message)
        }
      } catch (err) {
        console.warn('[MP Webhook] RPC increment_daily_capacity no disponible:', err)
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
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
