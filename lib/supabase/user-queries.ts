import { supabase } from './client'
import type { UserRole } from '@/types/auth'

export interface UserWithProfile {
  id: string
  email: string
  role: UserRole
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  last_sign_in_at: string | null
  created_at: string
  updated_at: string
}

export interface UserStats {
  total: number
  active: number
  inactive: number
  byRole: Record<UserRole, number>
}

export interface UpdateUserProfileData {
  first_name?: string
  last_name?: string
  phone?: string
  role?: UserRole
  is_active?: boolean
}

/**
 * List all user profiles. Because we cannot query auth.users directly from
 * the browser client, email is stored in a view or fetched via the API route.
 * Here we return data from user_profiles and rely on the API route for email.
 */
export async function getUsers(): Promise<UserWithProfile[]> {
  try {
    const response = await fetch('/api/admin/users')
    if (!response.ok) {
      const error = await response.json()
      console.error('Error fetching users:', error)
      return []
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

/**
 * Get a single user profile by id.
 */
export async function getUserById(id: string): Promise<UserWithProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return {
      ...data,
      email: '',
      last_sign_in_at: null,
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

/**
 * Update a user's role.
 */
export async function updateUserRole(id: string, role: UserRole): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error updating role:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Error updating role:', error)
    return false
  }
}

/**
 * Toggle a user's active status.
 */
export async function toggleUserActive(id: string, isActive: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error toggling user active status:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Error toggling user active status:', error)
    return false
  }
}

/**
 * Update profile fields (name, phone, role, is_active).
 */
export async function updateUserProfile(
  id: string,
  data: UpdateUserProfileData
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error updating user profile:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Error updating user profile:', error)
    return false
  }
}

/**
 * Create a new user with Supabase Auth + user_profiles entry.
 * This calls the server-side API route because supabaseAdmin can only run
 * server-side (it uses the service role key).
 */
export async function createUserWithProfile(
  email: string,
  password: string,
  role: UserRole,
  firstName: string,
  lastName: string,
  phone?: string
): Promise<{ success: boolean; user?: UserWithProfile; error?: string }> {
  try {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role, first_name: firstName, last_name: lastName, phone }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error || 'Error al crear usuario' }
    }

    return { success: true, user: result }
  } catch (error) {
    console.error('Error creating user:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

/**
 * Get aggregated user stats: total, active, inactive, count by role.
 */
export async function getUserStats(): Promise<UserStats> {
  const defaultStats: UserStats = {
    total: 0,
    active: 0,
    inactive: 0,
    byRole: {
      admin: 0,
      manager: 0,
      production: 0,
      sales: 0,
      accountant: 0,
      viewer: 0,
    },
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role, is_active')

    if (error) {
      console.error('Error fetching user stats:', error)
      return defaultStats
    }

    const stats = { ...defaultStats, byRole: { ...defaultStats.byRole } }
    stats.total = data.length

    for (const row of data) {
      if (row.is_active) stats.active++
      else stats.inactive++

      const role = row.role as UserRole
      if (role in stats.byRole) {
        stats.byRole[role]++
      }
    }

    return stats
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return defaultStats
  }
}
