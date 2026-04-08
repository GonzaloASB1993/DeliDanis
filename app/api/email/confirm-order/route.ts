import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resend, EMAIL_FROM } from '@/lib/email/client'
import { orderConfirmationHtml, type OrderEmailData } from '@/lib/email/templates'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Internal shared secret — callers must pass this header to invoke email endpoints.
// This prevents unauthenticated external actors from triggering emails to arbitrary customers.
// Set INTERNAL_API_SECRET in environment variables.
function isAuthorizedCaller(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false // If not configured, deny all external calls
  const header = request.headers.get('x-internal-secret')
  return header === secret
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedCaller(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 })
    }

    // Fetch order with customer and items
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
      subject: `Pedido Confirmado ${order.order_number} - DeliDanis`,
      html: orderConfirmationHtml(emailData),
    })

    if (error) {
      console.error('Error sending confirmation email:', error)
      // Log detail server-side; never return internal error message to client
      return NextResponse.json({ error: 'Error al enviar email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('Error in confirm-order:', err)
    return NextResponse.json(
      { error: 'Error interno enviando email' },
      { status: 500 }
    )
  }
}
