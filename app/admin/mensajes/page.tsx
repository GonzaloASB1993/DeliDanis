'use client'

import { Header } from '@/components/admin/Header'

export default function MensajesPage() {
  return (
    <div className="min-h-screen">
      <Header title="Mensajes" subtitle="Mensajes recibidos desde el formulario de contacto" />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-dark-light/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h2 className="text-xl font-semibold text-dark mb-2">Centro de Mensajes</h2>
          <p className="text-dark-light mb-4">Aquí verás los mensajes enviados desde el formulario de contacto.</p>
          <p className="text-sm text-dark-light">Próximamente: Bandeja de entrada con respuesta rápida</p>
        </div>
      </div>
    </div>
  )
}
