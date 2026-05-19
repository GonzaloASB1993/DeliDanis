'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, Building2, Phone, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/stores/toastStore'

interface CustomerProfile {
  first_name: string
  last_name: string
  phone: string
  business_name: string
  email: string
}

export default function B2BPerfilPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [profile, setProfile] = useState<CustomerProfile>({
    first_name: '',
    last_name: '',
    phone: '',
    business_name: '',
    email: '',
  })

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/b2b/login')
        return
      }

      const { data } = await supabase
        .from('customers')
        .select('first_name, last_name, phone, business_name')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          business_name: data.business_name || '',
          email: user.email || '',
        })
      }
      setIsLoading(false)
    }
    load()
  }, [router])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('customers')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          business_name: profile.business_name,
        })
        .eq('user_id', user.id)

      if (error) {
        toast.error('No se pudieron guardar los cambios.')
        return
      }
      toast.success('Perfil actualizado correctamente.')
    } catch {
      toast.error('Error inesperado. Intenta nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Las contraseñas no coinciden.')
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      })

      if (error) {
        toast.error(error.message || 'No se pudo cambiar la contraseña.')
        return
      }

      toast.success('Contraseña actualizada correctamente.')
      setPasswords({ newPassword: '', confirmPassword: '' })
    } catch {
      toast.error('Error inesperado. Intenta nuevamente.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  const INPUT_CLS =
    'w-full px-4 py-2.5 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors font-body'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-dark">Mi Perfil</h1>

      {/* Profile form */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl shadow-sm border border-border">
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-dark">Datos personales</h2>
              <p className="text-xs text-dark-light">Actualiza tu informacion de contacto</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Email (read only) */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-dark mb-1.5">
              <Mail size={12} className="text-dark-light" />
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              readOnly
              className={`${INPUT_CLS} bg-secondary cursor-not-allowed text-dark-light`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-dark mb-1.5">Nombre</label>
              <input
                type="text"
                value={profile.first_name}
                onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark mb-1.5">Apellido</label>
              <input
                type="text"
                value={profile.last_name}
                onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-dark mb-1.5">
              <Building2 size={12} className="text-dark-light" />
              Empresa
            </label>
            <input
              type="text"
              value={profile.business_name}
              onChange={e => setProfile(p => ({ ...p, business_name: e.target.value }))}
              placeholder="Nombre de tu empresa"
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-dark mb-1.5">
              <Phone size={12} className="text-dark-light" />
              Telefono
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              placeholder="+56 9 1234 5678"
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-colors"
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>

      {/* Password form */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl shadow-sm border border-border">
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-dark">Cambiar contraseña</h2>
              <p className="text-xs text-dark-light">Minimo 8 caracteres</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-dark mb-1.5">Nueva contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              value={passwords.newPassword}
              onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
              placeholder="Minimo 8 caracteres"
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-dark mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              value={passwords.confirmPassword}
              onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Repite la contraseña"
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end">
          <button
            type="submit"
            disabled={isChangingPassword}
            className="bg-dark hover:bg-dark-light disabled:opacity-60 text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-colors"
          >
            {isChangingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </div>
      </form>
    </div>
  )
}
