'use client'

import { Header } from '@/components/admin/Header'
import { Button } from '@/components/ui/Button'

export default function ConfiguracionPage() {
  return (
    <div className="min-h-screen">
      <Header title="Configuración" subtitle="Ajustes del sistema" />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información del negocio */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Información del Negocio
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Nombre del Negocio</label>
                <input
                  type="text"
                  defaultValue="DeliDanis"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Teléfono</label>
                <input
                  type="text"
                  defaultValue="+56 9 1234 5678"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Email</label>
                <input
                  type="email"
                  defaultValue="contacto@delidanis.cl"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Dirección</label>
                <input
                  type="text"
                  defaultValue="Santiago, Chile"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <Button className="w-full">Guardar Cambios</Button>
            </div>
          </div>

          {/* Capacidad diaria */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Capacidad y Horarios
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Pedidos máximos por día</label>
                <input
                  type="number"
                  defaultValue="5"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Días de anticipación mínima</label>
                <input
                  type="number"
                  defaultValue="5"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Horario de atención</label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    defaultValue="09:00"
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="self-center text-dark-light">a</span>
                  <input
                    type="time"
                    defaultValue="19:00"
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <Button className="w-full">Guardar Cambios</Button>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notificaciones
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 bg-secondary rounded-lg cursor-pointer">
                <span className="text-dark">Email al recibir pedido</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary focus:ring-primary" />
              </label>
              <label className="flex items-center justify-between p-3 bg-secondary rounded-lg cursor-pointer">
                <span className="text-dark">WhatsApp al cliente</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary focus:ring-primary" />
              </label>
              <label className="flex items-center justify-between p-3 bg-secondary rounded-lg cursor-pointer">
                <span className="text-dark">Recordatorio día anterior</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary focus:ring-primary" />
              </label>
              <label className="flex items-center justify-between p-3 bg-secondary rounded-lg cursor-pointer">
                <span className="text-dark">Alerta de stock bajo</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary focus:ring-primary" />
              </label>
            </div>
          </div>

          {/* Pagos */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Configuración de Pagos
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Porcentaje de seña (%)</label>
                <input
                  type="number"
                  defaultValue="50"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Costo de delivery</label>
                <input
                  type="number"
                  defaultValue="15000"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Mercado Pago / Stripe:</strong> Próximamente disponible
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
