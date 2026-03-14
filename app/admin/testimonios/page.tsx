'use client'

import { Header } from '@/components/admin/Header'
import { Button } from '@/components/ui/Button'

export default function TestimoniosAdminPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Testimonios"
        subtitle="Administra los testimonios de clientes"
        actions={
          <Button className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Testimonio
          </Button>
        }
      />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-dark-light/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h2 className="text-xl font-semibold text-dark mb-2">Testimonios de Clientes</h2>
          <p className="text-dark-light mb-4">Agrega y administra las reseñas de tus clientes satisfechos.</p>
          <p className="text-sm text-dark-light">Los testimonios aparecerán en la página principal y en la sección de testimonios.</p>
        </div>
      </div>
    </div>
  )
}
