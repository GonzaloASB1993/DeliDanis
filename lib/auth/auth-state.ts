// Singleton para manejar el estado de autenticación
// Esto evita problemas con React StrictMode que monta/desmonta componentes

import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/auth'

type AuthListener = (state: AuthState) => void

interface AuthState {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isInitialized: boolean
}

class AuthManager {
  private state: AuthState = {
    user: null,
    profile: null,
    isLoading: true,
    isInitialized: false,
  }

  private listeners: Set<AuthListener> = new Set()
  private initPromise: Promise<void> | null = null

  constructor() {
    // Inicializar una sola vez
    this.initialize()
  }

  private async initialize() {
    if (this.initPromise) return this.initPromise

    this.initPromise = this.doInitialize()
    return this.initPromise
  }

  private async doInitialize() {
    console.log('[AuthManager] Initializing...')

    try {
      // Obtener sesión actual
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('[AuthManager] Session error:', error)
        this.updateState({ isLoading: false, isInitialized: true })
        return
      }

      if (session?.user) {
        console.log('[AuthManager] Session found:', session.user.email)
        this.updateState({ user: session.user })

        // Cargar perfil
        await this.loadProfile(session.user.id)
      } else {
        console.log('[AuthManager] No session')
      }

      this.updateState({ isLoading: false, isInitialized: true })
    } catch (error) {
      console.error('[AuthManager] Init error:', error)
      this.updateState({ isLoading: false, isInitialized: true })
    }

    // Escuchar cambios
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthManager] Event:', event)

      // Ignorar INITIAL_SESSION ya que lo manejamos arriba con getSession()
      if (event === 'INITIAL_SESSION') {
        return
      }

      if (event === 'SIGNED_IN' && session?.user) {
        // Si ya tenemos este usuario y su perfil, no hacer nada
        // (esto evita el loading innecesario al cambiar de pestaña)
        if (this.state.user?.id === session.user.id && this.state.profile) {
          console.log('[AuthManager] Already have this user, skipping reload')
          return
        }

        // Nuevo login real
        this.updateState({ user: session.user, isLoading: true })
        await this.loadProfile(session.user.id)
        this.updateState({ isLoading: false })
      } else if (event === 'SIGNED_OUT') {
        this.updateState({ user: null, profile: null, isLoading: false })
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Token refrescado - no mostrar loading, solo actualizar silenciosamente
        console.log('[AuthManager] Token refreshed silently')
        // No recargar perfil a menos que sea necesario
      }
    })
  }

  private async loadProfile(userId: string, retries = 3): Promise<UserProfile | null> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Pequeño delay para RLS
        if (attempt === 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        console.log(`[AuthManager] Loading profile, attempt ${attempt}`)

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error(`[AuthManager] Profile error:`, error.code, error.message)

          if (error.code === 'PGRST116') {
            // Perfil no existe
            return null
          }

          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 300 * attempt))
            continue
          }
          return null
        }

        if (data && !data.is_active) {
          console.log('[AuthManager] User inactive')
          await supabase.auth.signOut()
          this.updateState({ user: null, profile: null })
          return null
        }

        console.log('[AuthManager] Profile loaded:', data?.email, 'role:', data?.role)
        this.updateState({ profile: data })
        return data
      } catch (error) {
        console.error(`[AuthManager] Exception:`, error)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 300 * attempt))
          continue
        }
      }
    }
    return null
  }

  private updateState(partial: Partial<AuthState>) {
    this.state = { ...this.state, ...partial }
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state))
  }

  // API pública
  getState(): AuthState {
    return this.state
  }

  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener)
    // Notificar inmediatamente con el estado actual
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Credenciales inválidas' }
        }
        return { error: error.message }
      }

      if (data.user) {
        this.updateState({ user: data.user, isLoading: true })

        const profile = await this.loadProfile(data.user.id)

        if (!profile) {
          // Crear perfil si no existe
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              role: 'admin',
              is_active: true,
            })

          if (insertError) {
            console.error('[AuthManager] Create profile error:', insertError)
            await supabase.auth.signOut()
            this.updateState({ user: null, profile: null, isLoading: false })
            return { error: 'Error al crear perfil' }
          }

          await this.loadProfile(data.user.id)
        }

        // Actualizar último login
        await supabase
          .from('user_profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id)

        this.updateState({ isLoading: false })
      }

      return { error: null }
    } catch (error) {
      console.error('[AuthManager] Sign in error:', error)
      return { error: 'Error al iniciar sesión' }
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
    this.updateState({ user: null, profile: null })
  }

  async refreshProfile(): Promise<void> {
    if (this.state.user) {
      await this.loadProfile(this.state.user.id)
    }
  }
}

// Singleton
export const authManager = new AuthManager()
