import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { UserRole } from '@/types/auth'

/**
 * GET /api/admin/users
 * Returns all user profiles joined with their auth email and last sign-in date.
 * Uses supabaseAdmin (service role) to access auth.users.
 */
export async function GET() {
  try {
    // Fetch auth users list
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('Error listing auth users:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Fetch all user profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
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
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}

/**
 * POST /api/admin/users
 * Creates a new Supabase auth user and the corresponding user_profile row.
 * Body: { email, password, role, first_name, last_name, phone? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, role, first_name, last_name, phone } = body

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

    // Create user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        role,
        first_name,
        last_name,
        phone: phone || null,
        is_active: true,
      })
      .select()
      .single()

    if (profileError) {
      // Rollback: delete the auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(userId)
      console.error('Error creating user profile:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
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
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
