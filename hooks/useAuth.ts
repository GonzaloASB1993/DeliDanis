'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { authManager } from '@/lib/auth/auth-state'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, UserRole } from '@/types/auth'
import { hasPermission } from '@/types/auth'

interface UseAuthReturn {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  hasPermission: (permission: string) => boolean
  refreshProfile: () => Promise<void>
}

// Función para obtener snapshot del estado
function getSnapshot() {
  return authManager.getState()
}

// Snapshot del servidor (SSR) - DEBE estar cacheado para evitar loops infinitos
const SERVER_SNAPSHOT = {
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
} as const

function getServerSnapshot() {
  return SERVER_SNAPSHOT
}

export function useAuth(): UseAuthReturn {
  const router = useRouter()

  // Usar useSyncExternalStore para suscribirse al singleton
  const state = useSyncExternalStore(
    authManager.subscribe.bind(authManager),
    getSnapshot,
    getServerSnapshot
  )

  // Verificar permiso
  const checkPermission = useCallback((permission: string): boolean => {
    if (!state.profile) return false
    return hasPermission(state.profile.role as UserRole, permission)
  }, [state.profile])

  // Sign out con redirección
  const signOut = useCallback(async () => {
    await authManager.signOut()
    router.push('/admin/login')
  }, [router])

  return {
    user: state.user,
    profile: state.profile,
    isLoading: state.isLoading,
    isAuthenticated: !!state.user && !!state.profile,
    signIn: authManager.signIn.bind(authManager),
    signOut,
    hasPermission: checkPermission,
    refreshProfile: authManager.refreshProfile.bind(authManager),
  }
}
