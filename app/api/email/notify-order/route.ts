import { NextResponse } from 'next/server'
import { resend, EMAIL_FROM, EMAIL_BUSINESS } from '@/lib/email/client'
import { newOrderNotificationHtml, type OrderEmailData } from '@/lib/email/templates'

export async function POST(request: Request) {
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
      return NextResponse.json({ error: error.message }, { status: 500 })
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
