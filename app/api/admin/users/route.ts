import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/auth'

/**
 * Verifies the caller is an authenticated admin or owner.
 * Returns null if authorized, or a 401/403 NextResponse if not.
 * Protects against unauthenticated callers accessing the service-role endpoint.
 */
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
  if (!profile?.is_active || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }
  return null
}

/**
 * GET /api/admin/users
 * Returns all user profiles joined with their auth email and last sign-in date.
 * Uses supabaseAdmin (service role) to access auth.users.
 */
export async function GET() {
  // Guard: only authenticated admins may list all users
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    // Fetch auth users list
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('Error listing auth users:', authError)
      // Never expose supabase/auth internal error messages to the client
      return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
    }

    // Fetch all user profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError)
      return NextResponse.json({ error: 'Error al obtener perfiles' }, { status: 500 })
    }

    // Build a map from profile id to auth user
    const authMap = new Map(authData.users.map(u => [u.id, u]))

    const users = profiles.map(profile => {
      const authUser = authMap.get(profile.id)
      return {
        id: profile.id,
        email: authUser?.email ?? '',
        role: profile.role as UserRole,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        is_active: profile.is_active,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

/**
 * POST /api/admin/users
 * Creates a new Supabase auth user and the corresponding user_profile row.
 * Body: { email, password, role, first_name, last_name, phone? }
 */
export async function POST(request: NextRequest) {
  // Guard: only authenticated admins may create users
  const authCheck = await requireAdmin()
  if (authCheck) return authCheck

  try {
    const body = await request.json()
    const { email, password, role, first_name, last_name, phone, business_name } = body

    if (!email || !password || !role || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'email, password, role, first_name y last_name son requeridos' },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // Update user profile (trigger handle_new_user already created it with role 'viewer')
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        email,
        role,
        first_name,
        last_name,
        phone: phone || null,
        is_active: true,
      })
      .eq('id', userId)
      .select()
      .single()

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      console.error('Error creating user profile:', profileError)
      return NextResponse.json({ error: 'Error al crear perfil de usuario' }, { status: 500 })
    }

    // For b2b_client, also create a business customer record
    if (role === 'b2b_client') {
      const { error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          user_id: userId,
          email,
          phone: phone || '',
          first_name,
          last_name,
          business_name: business_name || null,
          type: 'business',
        })

      if (customerError) {
        console.error('Error creating B2B customer:', customerError)
      }
    }

    return NextResponse.json({
      id: userId,
      email,
      role,
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      is_active: profile.is_active,
      last_sign_in_at: null,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/users:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
