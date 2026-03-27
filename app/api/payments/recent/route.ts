import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'

export async function GET() {
  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })

    const payment = new Payment(client)
    const response = await payment.search({ options: { limit: 5, sort: 'date_created', criteria: 'desc' } })

    const payments = (response.results ?? []).map((p: any) => ({
      id: p.id,
      status: p.status,
      amount: p.transaction_amount,
      date: p.date_created,
      description: p.description,
    }))

    return NextResponse.json({ payments })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : JSON.stringify(error)
    console.error('[MP recent] Error:', errMsg)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
