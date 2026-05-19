import { Suspense } from 'react'
import { B2BLoginForm } from '@/components/b2b/B2BLoginForm'

export const metadata = {
  title: 'Ingresar - DeliDanis B2B',
}

function LoginFormFallback() {
  return (
    <div className="space-y-5">
      <div className="h-10 bg-border/50 rounded-lg animate-pulse" />
      <div className="h-10 bg-border/50 rounded-lg animate-pulse" />
      <div className="h-12 bg-primary/20 rounded-full animate-pulse" />
    </div>
  )
}

export default function B2BLoginPage() {
  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-3xl text-dark mb-1">
            Deli<span className="text-primary">Danis</span>{' '}
            <span className="font-body font-semibold text-lg align-middle bg-primary text-white px-2.5 py-0.5 rounded-full">
              B2B
            </span>
          </h1>
          <p className="font-body text-sm text-dark-light mt-3">
            Portal mayorista para cafeterías
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          <h2 className="font-display font-semibold text-xl text-dark mb-6">
            Inicia sesión
          </h2>

          <Suspense fallback={<LoginFormFallback />}>
            <B2BLoginForm />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="font-body text-xs text-dark-light text-center mt-6">
          ¿No tienes cuenta? Contacta a DeliDanis para solicitar acceso.
        </p>
      </div>
    </div>
  )
}
