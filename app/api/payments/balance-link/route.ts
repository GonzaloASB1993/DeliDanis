// app/api/payments/balance-link/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createPreference } from '@/lib/payments/mercadopago'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

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
