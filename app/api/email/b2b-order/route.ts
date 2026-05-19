import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resend, EMAIL_FROM, EMAIL_BUSINESS } from '@/lib/email/client'
import {
  b2bOrderNotificationHtml,
  b2bOrderReceivedHtml,
  type OrderEmailData,
} from '@/lib/email/templates'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 })
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_items(*)
      `)
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    const emailData: OrderEmailData = {
      orderNumber: order.order_number,
      customerName: [order.customer.first_name, order.customer.last_name].filter(Boolean).join(' '),
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone,
      eventDate: order.event_date,
      eventTime: order.event_time,
      eventType: order.event_type,
      deliveryType: order.delivery_type ?? 'pickup',
      deliveryAddress: order.delivery_address,
      deliveryCity: order.delivery_city,
      deliveryFee: order.delivery_fee ?? 0,
      subtotal: order.subtotal,
      total: order.total,
      items: order.items,
      isB2B: true,
    }

    const results = await Promise.allSettled([
      resend.emails.send({
        from: EMAIL_FROM,
        to: EMAIL_BUSINESS,
        subject: `Nuevo Pedido B2B ${order.order_number} - ${emailData.customerName}`,
        html: b2bOrderNotificationHtml(emailData),
      }),
      resend.emails.send({
        from: EMAIL_FROM,
        to: order.customer.email,
        subject: `Pedido Recibido ${order.order_number} - DeliDanis`,
        html: b2bOrderReceivedHtml(emailData),
      }),
    ])

    const adminResult = results[0]
    const clientResult = results[1]

    if (adminResult.status === 'rejected') {
      console.error('Error sending B2B admin email:', adminResult.reason)
    }
    if (clientResult.status === 'rejected') {
      console.error('Error sending B2B client email:', clientResult.reason)
    }

    return NextResponse.json({
      success: true,
      adminSent: adminResult.status === 'fulfilled',
      clientSent: clientResult.status === 'fulfilled',
    })
  } catch (err) {
    console.error('Error in b2b-order email:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
