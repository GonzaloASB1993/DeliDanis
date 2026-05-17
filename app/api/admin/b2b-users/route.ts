import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function requireAdmin(): Promise<NextResponse | null> {
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
  if (!profile?.is_active || !['admin', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }
  return null
}

/**
 * POST /api/admin/b2b-users
 * Creates a B2B user: auth user + user_profile (b2b_client) + customer (business).
 * Body: { email, password, business_name, phone?, address?, city? }
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin()
  if (authCheck) return authCheck

  try {
    const body = await request.json()
    const { email, password, business_name, phone, address, city } = body

    if (!email || !password || !business_name) {
      return NextResponse.json(
        { error: 'email, password y business_name son requeridos' },
        { status: 400 }
      )
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Create user_profile with b2b_client role
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        role: 'b2b_client',
        first_name: business_name,
        last_name: null,
        phone: phone || null,
        is_active: true,
      })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Error al crear perfil' }, { status: 500 })
    }

    // 3. Create customer record with type 'business'
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        user_id: userId,
        email,
        phone: phone || null,
        first_name: business_name,
        last_name: null,
        address: address || null,
        city: city || null,
        type: 'business',
        tags: ['b2b', 'cafeteria'],
      })
      .select()
      .single()

    if (customerError) {
      await supabaseAdmin.from('user_profiles').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
    }

    return NextResponse.json({
      id: userId,
      email,
      business_name,
      customer_id: customer.id,
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/b2b-users:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
