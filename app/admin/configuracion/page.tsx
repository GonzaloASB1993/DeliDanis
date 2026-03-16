'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/admin/Header'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

interface BusinessSettings {
  name: string
  phone: string
  email: string
  address: string
  city: string
  description: string
}

interface CapacitySettings {
  max_daily_orders: number
  min_advance_days: number
  opening_time: string
  closing_time: string
  blocked_days: string[] // e.g. ['monday']
}

interface NotificationSettings {
  email_on_order: boolean
  whatsapp_to_client: boolean
  reminder_day_before: boolean
  low_stock_alert: boolean
  email_on_payment: boolean
}

interface PaymentSettings {
  deposit_percentage: number
  delivery_cost: number
  accept_cash: boolean
  accept_transfer: boolean
  accept_mercadopago: boolean
}

const DEFAULT_BUSINESS: BusinessSettings = {
  name: 'DeliDanis',
  phone: '+56 9 3928 2764',
  email: 'contacto@delidanis.cl',
  address: 'Santiago, Chile',
  city: 'Santiago',
  description: 'Pastelería artesanal especializada en tortas para eventos',
}

const DEFAULT_CAPACITY: CapacitySettings = {
  max_daily_orders: 5,
  min_advance_days: 5,
  opening_time: '09:00',
  closing_time: '19:00',
  blocked_days: [],
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  email_on_order: true,
  whatsapp_to_client: true,
  reminder_day_before: true,
  low_stock_alert: true,
  email_on_payment: true,
}

const DEFAULT_PAYMENTS: PaymentSettings = {
  deposit_percentage: 50,
  delivery_cost: 15000,
  accept_cash: true,
  accept_transfer: true,
  accept_mercadopago: false,
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
]

export default function ConfiguracionPage() {
  const [business, setBusiness] = useState<BusinessSettings>(DEFAULT_BUSINESS)
  const [capacity, setCapacity] = useState<CapacitySettings>(DEFAULT_CAPACITY)
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS)
  const [payments, setPayments] = useState<PaymentSettings>(DEFAULT_PAYMENTS)
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [savedSection, setSavedSection] = useState<string | null>(null)

  // Load settings from Supabase
  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('key, value')

        if (error) throw error

        if (data) {
          data.forEach(setting => {
            switch (setting.key) {
              case 'business':
                setBusiness({ ...DEFAULT_BUSINESS, ...setting.value })
                break
              case 'capacity':
                setCapacity({ ...DEFAULT_CAPACITY, ...setting.value })
                break
              case 'notifications':
                setNotifications({ ...DEFAULT_NOTIFICATIONS, ...setting.value })
                break
              case 'payments':
                setPayments({ ...DEFAULT_PAYMENTS, ...setting.value })
                break
            }
          })
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const saveSetting = useCallback(async (key: string, value: Record<string, unknown>) => {
    setSaving(key)
    try {
      const { error } = await supabase
        .from('settings')
        .upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )

      if (error) throw error
      setSavedSection(key)
      setTimeout(() => setSavedSection(null), 2000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(null)
    }
  }, [])

  const toggleBlockedDay = useCallback((day: string) => {
    setCapacity(prev => ({
      ...prev,
      blocked_days: prev.blocked_days.includes(day)
        ? prev.blocked_days.filter(d => d !== day)
        : [...prev.blocked_days, day],
    }))
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Configuración" subtitle="Ajustes del sistema" />
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-border p-6 animate-pulse">
                <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
                <div className="space-y-3">
                  <div className="h-10 bg-gray-100 rounded" />
                  <div className="h-10 bg-gray-100 rounded" />
                  <div className="h-10 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

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
                  value={business.name}
                  onChange={e => setBusiness(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Teléfono</label>
                <input
                  type="text"
                  value={business.phone}
                  onChange={e => setBusiness(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Email</label>
                <input
                  type="email"
                  value={business.email}
                  onChange={e => setBusiness(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Dirección</label>
                <input
                  type="text"
                  value={business.address}
                  onChange={e => setBusiness(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Ciudad</label>
                <input
                  type="text"
                  value={business.city}
                  onChange={e => setBusiness(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Descripción</label>
                <textarea
                  value={business.description}
                  onChange={e => setBusiness(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => saveSetting('business', business as unknown as Record<string, unknown>)}
                disabled={saving === 'business'}
              >
                {saving === 'business' ? 'Guardando...' : savedSection === 'business' ? 'Guardado' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>

          {/* Capacidad y Horarios */}
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
                  value={capacity.max_daily_orders}
                  onChange={e => setCapacity(prev => ({ ...prev, max_daily_orders: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Días de anticipación mínima</label>
                <input
                  type="number"
                  value={capacity.min_advance_days}
                  onChange={e => setCapacity(prev => ({ ...prev, min_advance_days: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Horario de atención</label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={capacity.opening_time}
                    onChange={e => setCapacity(prev => ({ ...prev, opening_time: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="self-center text-dark-light">a</span>
                  <input
                    type="time"
                    value={capacity.closing_time}
                    onChange={e => setCapacity(prev => ({ ...prev, closing_time: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Días sin atención</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.key}
                      onClick={() => toggleBlockedDay(day.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        capacity.blocked_days.includes(day.key)
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-secondary text-dark-light border border-border hover:bg-gray-100'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => saveSetting('capacity', capacity as unknown as Record<string, unknown>)}
                disabled={saving === 'capacity'}
              >
                {saving === 'capacity' ? 'Guardando...' : savedSection === 'capacity' ? 'Guardado' : 'Guardar Cambios'}
              </Button>
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
            <div className="space-y-3">
              {[
                { key: 'email_on_order', label: 'Email al recibir pedido', desc: 'Notificar al negocio cuando llega un nuevo pedido' },
                { key: 'email_on_payment', label: 'Email al recibir pago', desc: 'Notificar cuando se registra un pago' },
                { key: 'whatsapp_to_client', label: 'WhatsApp al cliente', desc: 'Enviar confirmación por WhatsApp al cliente' },
                { key: 'reminder_day_before', label: 'Recordatorio día anterior', desc: 'Recordar al cliente un día antes del evento' },
                { key: 'low_stock_alert', label: 'Alerta de stock bajo', desc: 'Notificar cuando un insumo está por debajo del mínimo' },
              ].map(item => (
                <label key={item.key} className="flex items-start justify-between p-3 bg-secondary rounded-lg cursor-pointer group hover:bg-secondary/80">
                  <div>
                    <span className="text-dark font-medium text-sm">{item.label}</span>
                    <p className="text-xs text-dark-light mt-0.5">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications[item.key as keyof NotificationSettings] as boolean}
                    onChange={e => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    className="w-5 h-5 rounded text-primary focus:ring-primary mt-0.5 flex-shrink-0"
                  />
                </label>
              ))}
              <Button
                className="w-full mt-2"
                onClick={() => saveSetting('notifications', notifications as unknown as Record<string, unknown>)}
                disabled={saving === 'notifications'}
              >
                {saving === 'notifications' ? 'Guardando...' : savedSection === 'notifications' ? 'Guardado' : 'Guardar Cambios'}
              </Button>
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
                  value={payments.deposit_percentage}
                  onChange={e => setPayments(prev => ({ ...prev, deposit_percentage: parseInt(e.target.value) || 0 }))}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="text-xs text-dark-light mt-1">Porcentaje del total que se cobra como anticipo</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Costo de delivery ($)</label>
                <input
                  type="number"
                  value={payments.delivery_cost}
                  onChange={e => setPayments(prev => ({ ...prev, delivery_cost: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Métodos de pago aceptados</label>
                <div className="space-y-2">
                  {[
                    { key: 'accept_cash', label: 'Efectivo' },
                    { key: 'accept_transfer', label: 'Transferencia bancaria' },
                    { key: 'accept_mercadopago', label: 'Mercado Pago' },
                  ].map(method => (
                    <label key={method.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={payments[method.key as keyof PaymentSettings] as boolean}
                        onChange={e => setPayments(prev => ({ ...prev, [method.key]: e.target.checked }))}
                        className="w-4 h-4 rounded text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-dark">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => saveSetting('payments', payments as unknown as Record<string, unknown>)}
                disabled={saving === 'payments'}
              >
                {saving === 'payments' ? 'Guardando...' : savedSection === 'payments' ? 'Guardado' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>

          {/* Zona de peligro */}
          <div className="bg-white rounded-xl border border-red-200 p-6 lg:col-span-2">
            <h3 className="font-semibold text-red-600 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Zona de Peligro
            </h3>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-dark">Restablecer configuración</p>
                <p className="text-xs text-dark-light">Volver a los valores predeterminados del sistema</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de restablecer toda la configuración? Esta acción no se puede deshacer.')) {
                    setBusiness(DEFAULT_BUSINESS)
                    setCapacity(DEFAULT_CAPACITY)
                    setNotifications(DEFAULT_NOTIFICATIONS)
                    setPayments(DEFAULT_PAYMENTS)
                    Promise.all([
                      saveSetting('business', DEFAULT_BUSINESS as unknown as Record<string, unknown>),
                      saveSetting('capacity', DEFAULT_CAPACITY as unknown as Record<string, unknown>),
                      saveSetting('notifications', DEFAULT_NOTIFICATIONS as unknown as Record<string, unknown>),
                      saveSetting('payments', DEFAULT_PAYMENTS as unknown as Record<string, unknown>),
                    ])
                  }
                }}
                className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Restablecer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
