import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!

    const res = await fetch(
      'https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=10',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await res.json()
    console.log('[MP recent] raw response:', JSON.stringify(data).slice(0, 500))

    if (!res.ok) {
      return NextResponse.json({ error: data.message || JSON.stringify(data) }, { status: res.status })
    }

    const payments = (data.results ?? []).map((p: any) => ({
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
