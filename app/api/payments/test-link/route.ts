import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.delidanis.cl'

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json()

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })

    const preference = new Preference(client)

    const response = await preference.create({
      body: {
        items: [
          {
            id: 'activacion-mp',
            title: 'Activación MercadoPago - DeliDanis',
            quantity: 1,
            unit_price: Math.round(amount),
          },
        ],
        back_urls: {
          success: `${APP_URL}/admin/configuracion?mp_activated=true`,
          failure: `${APP_URL}/admin/configuracion?mp_activated=false`,
          pending: `${APP_URL}/admin/configuracion?mp_activated=pending`,
        },
      },
    })

    if (!response.init_point || !response.id) {
      throw new Error('MP no devolvió init_point')
    }

    return NextResponse.json({
      initPoint: response.init_point,
      preferenceId: response.id,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : JSON.stringify(error)
    console.error('[MP test-link] Error:', errMsg)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
