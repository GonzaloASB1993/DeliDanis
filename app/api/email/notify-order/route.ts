import { NextRequest, NextResponse } from 'next/server'
import { resend, EMAIL_FROM, EMAIL_BUSINESS } from '@/lib/email/client'
import { newOrderNotificationHtml, type OrderEmailData } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  // Guard: only internal callers (server-to-server) may trigger admin notifications.
  // Without this check anyone can flood the business inbox with fake order emails.
  const internalSecret = process.env.INTERNAL_API_SECRET
  const callerSecret = request.headers.get('x-internal-secret')
  if (!internalSecret || callerSecret !== internalSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body: OrderEmailData = await request.json()

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: EMAIL_BUSINESS,
      subject: `Nuevo Pedido ${body.orderNumber} - ${body.customerName}`,
      html: newOrderNotificationHtml(body),
    })

    if (error) {
      console.error('Error sending notification email:', error)
      // Log detail server-side; never return internal error message to client
      return NextResponse.json({ error: 'Error al enviar email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('Error in notify-order:', err)
    return NextResponse.json(
      { error: 'Error interno enviando email' },
      { status: 500 }
    )
  }
}
