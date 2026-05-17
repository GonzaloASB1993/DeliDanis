'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export function B2BLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setError('No tenés permisos para acceder al portal B2B.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError || !data.user) {
        setError('Email o contraseña incorrectos.')
        return
      }

      // Verify role is b2b_client and account is active
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, is_active')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        await supabase.auth.signOut()
        setError('No se pudo verificar tu cuenta. Contactá a DeliDanis.')
        return
      }

      if (profile.role !== 'b2b_client') {
        await supabase.auth.signOut()
        setError('Esta cuenta no tiene acceso al portal mayorista.')
        return
      }

      if (!profile.is_active) {
        await supabase.auth.signOut()
        setError('Tu cuenta está desactivada. Contactá a DeliDanis.')
        return
      }

      router.push('/b2b')
      router.refresh()
    } catch {
      setError('Ocurrió un error inesperado. Intentá de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-body rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block font-body text-sm font-medium text-dark"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-border rounded-lg px-4 py-2.5 font-body text-sm text-dark placeholder:text-dark-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          placeholder="tu@email.com"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block font-body text-sm font-medium text-dark"
        >
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-border rounded-lg px-4 py-2.5 font-body text-sm text-dark placeholder:text-dark-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary hover:bg-primary-hover text-white font-body text-sm font-semibold py-3 rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  )
}
