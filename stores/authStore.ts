import { create } from 'zustand'
import type { UserProfile } from '@/types/auth'

interface AuthStore {
  profile: UserProfile | null
  setProfile: (profile: UserProfile | null) => void
  clearAuth: () => void
}

// NOTA: Removido 'persist' porque causaba conflictos con datos viejos en localStorage
// La autenticación ahora se maneja completamente desde el hook useAuth
export const useAuthStore = create<AuthStore>()((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  clearAuth: () => set({ profile: null }),
}))
