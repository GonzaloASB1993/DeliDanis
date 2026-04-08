import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Guard: only authenticated admins may query live payment data.
  // This endpoint uses the MercadoPago access token — exposing it
  // to unauthenticated callers leaks real transaction data.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()
  if (!profile?.is_active || !['admin', 'owner', 'accountant'].includes(profile.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

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
    // Never expose raw internal error details to the client — log server-side only
    return NextResponse.json({ error: 'Error interno al consultar pagos' }, { status: 500 })
  }
}
