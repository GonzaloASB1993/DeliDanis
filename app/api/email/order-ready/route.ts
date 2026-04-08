import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resend, EMAIL_FROM } from '@/lib/email/client'
import { orderReadyHtml, type OrderEmailData } from '@/lib/email/templates'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  // Guard: require authenticated admin session or internal secret.
  // Prevents unauthenticated callers from spamming customers with emails.
  const internalSecret = process.env.INTERNAL_API_SECRET
  const callerSecret = request.headers.get('x-internal-secret')
  const isInternal = internalSecret && callerSecret === internalSecret

  if (!isInternal) {
    const sessionClient = await createServerSupabaseClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

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
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    const emailData: OrderEmailData = {
      orderNumber: order.order_number,
      customerName: `${order.customer.first_name} ${order.customer.last_name}`,
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone,
      eventDate: order.event_date,
      eventTime: order.event_time,
      eventType: order.event_type,
      deliveryType: order.delivery_type,
      deliveryAddress: order.delivery_address,
      deliveryCity: order.delivery_city,
      deliveryFee: order.delivery_fee,
      subtotal: order.subtotal,
      total: order.total,
      items: order.items,
    }

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: order.customer.email,
      subject: `Tu Pedido ${order.order_number} esta Listo - DeliDanis`,
      html: orderReadyHtml(emailData),
    })

    if (error) {
      console.error('Error sending order-ready email:', error)
      // Log detail server-side; never return internal error message to client
      return NextResponse.json({ error: 'Error al enviar email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('Error in order-ready:', err)
    return NextResponse.json(
      { error: 'Error interno enviando email' },
      { status: 500 }
    )
  }
}
