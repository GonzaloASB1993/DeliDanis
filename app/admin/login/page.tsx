'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, isAuthenticated, isLoading } = useAuth()

  const redirectTo = searchParams.get('redirect') || '/admin'
  const errorParam = searchParams.get('error')

  useEffect(() => {
    if (errorParam === 'inactive') {
      setError('Tu cuenta ha sido desactivada. Contacta al administrador.')
    }
  }, [errorParam])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError(signInError)
      setIsSubmitting(false)
    } else {
      router.push(redirectTo)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-white to-secondary/50 p-4">
      <div className="w-full max-w-md">
        {/* Card de login */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-border">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.png"
                alt="DeliDanis"
                width={80}
                height={80}
                className="rounded-full"
              />
            </div>
            <h1 className="font-display text-2xl font-bold text-dark">
              Panel Administrativo
            </h1>
            <p className="text-dark-light mt-2">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark mb-1.5">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark mb-1.5">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Ingresando...
                </span>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-primary hover:text-primary-hover transition-colors">
              Volver al sitio principal
            </a>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-dark-light text-sm mt-6">
          &copy; {new Date().getFullYear()} DeliDanis. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  )
}
