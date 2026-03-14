'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/admin/Header'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/types/auth'
import { supabase } from '@/lib/supabase/client'

export default function PerfilPage() {
  const { profile, user, refreshProfile } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
      setPhone(profile.phone || '')
    }
  }, [profile])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setIsSaving(true)
    setSaveMessage(null)

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw error

      await refreshProfile()
      setSaveMessage({ type: 'success', text: 'Perfil actualizado correctamente' })
    } catch (error) {
      console.error('Error updating profile:', error)
      setSaveMessage({ type: 'error', text: 'Error al actualizar el perfil' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'La nueva contrasena debe tener al menos 6 caracteres' })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Las contrasenas no coinciden' })
      return
    }

    setIsChangingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage({ type: 'success', text: 'Contrasena actualizada correctamente' })
    } catch (error: any) {
      console.error('Error changing password:', error)
      setPasswordMessage({ type: 'error', text: error.message || 'Error al cambiar la contrasena' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const initials = (profile?.first_name?.[0] || profile?.email?.[0] || 'U').toUpperCase()

  return (
    <div className="min-h-screen">
      <Header title="Mi Perfil" subtitle="Gestiona tu informacion personal" />
      <div className="p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Avatar e Info */}
          <div className="bg-white rounded-xl border border-border p-6 flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-3xl">{initials}</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-dark">
                {profile?.first_name || 'Usuario'} {profile?.last_name || ''}
              </h2>
              <p className="text-dark-light">{profile?.email}</p>
              <span className="inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {profile?.role ? ROLE_LABELS[profile.role] : 'Sin rol'}
              </span>
            </div>
          </div>

          {/* Formulario de perfil */}
          <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Informacion Personal
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-1">Nombre</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1">Apellido</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Tu apellido"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Telefono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-border rounded-lg bg-secondary text-dark-light cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Rol</label>
                <input
                  type="text"
                  value={profile?.role ? ROLE_LABELS[profile.role] : ''}
                  disabled
                  className="w-full px-3 py-2 border border-border rounded-lg bg-secondary text-dark-light cursor-not-allowed"
                />
              </div>

              {saveMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  saveMessage.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {saveMessage.text}
                </div>
              )}

              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>

          {/* Cambio de contrasena */}
          <form onSubmit={handleChangePassword} className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Cambiar Contrasena
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Nueva contrasena</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Minimo 6 caracteres"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Confirmar nueva contrasena</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Repite la contrasena"
                  required
                />
              </div>

              {passwordMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  passwordMessage.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {passwordMessage.text}
                </div>
              )}

              <Button type="submit" disabled={isChangingPassword} className="w-full">
                {isChangingPassword ? 'Actualizando...' : 'Cambiar Contrasena'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
