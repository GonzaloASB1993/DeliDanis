// app/api/payments/preference/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
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

    const supabase = await createServerSupabaseClient()

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

    // Obtener porcentaje de depósito desde settings (key: 'payments', value: {deposit_percentage: N})
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
    const errMsg = error instanceof Error ? error.message : JSON.stringify(error)
    const errStack = error instanceof Error ? error.stack : undefined
    console.error('[Payments] Error creando preferencia - message:', errMsg)
    console.error('[Payments] Error creando preferencia - stack:', errStack)
    console.error('[Payments] Error creando preferencia - raw:', error)
    return NextResponse.json(
      { error: 'Error interno al crear preferencia de pago', detail: errMsg },
      { status: 500 }
    )
  }
}
