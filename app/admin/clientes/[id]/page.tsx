'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/admin/Header'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import {
  getCustomerById,
  updateCustomer,
  addCustomerTag,
  removeCustomerTag,
  type CustomerWithOrders,
  type CustomerFormData,
} from '@/lib/supabase/customer-queries'

// ============ Helpers ============

const TAG_COLORS = [
  'bg-pink-100 text-pink-700',
  'bg-purple-100 text-purple-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-yellow-100 text-yellow-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
]

function getTagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  in_production: { label: 'En producción', color: 'bg-purple-100 text-purple-700' },
  ready: { label: 'Listo', color: 'bg-teal-100 text-teal-700' },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  partial: { label: 'Parcial', color: 'bg-orange-100 text-orange-700' },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
}

// ============ Edit Info Modal ============

interface EditInfoModalProps {
  customer: CustomerWithOrders
  onClose: () => void
  onSave: (data: Partial<CustomerFormData>) => Promise<void>
  isSaving: boolean
}

function EditInfoModal({ customer, onClose, onSave, isSaving }: EditInfoModalProps) {
  const [form, setForm] = useState({
    first_name: customer.first_name ?? '',
    last_name: customer.last_name ?? '',
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    address: customer.address ?? '',
    city: customer.city ?? '',
    birthday: customer.birthday ?? '',
  })

  const set = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white">
          <h2 className="font-display text-lg font-bold text-dark">Editar información</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg text-dark-light transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Nombre</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => set('first_name', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Apellido</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => set('last_name', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Cumpleaños</label>
              <input
                type="date"
                value={form.birthday}
                onChange={(e) => set('birthday', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Dirección</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-border rounded-full text-sm font-medium text-dark hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============ Edit Notes Modal ============

interface EditNotesModalProps {
  notes: string
  onClose: () => void
  onSave: (notes: string) => Promise<void>
  isSaving: boolean
}

function EditNotesModal({ notes, onClose, onSave, isSaving }: EditNotesModalProps) {
  const [value, setValue] = useState(notes)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(value)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold text-dark">Editar notas</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg text-dark-light transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={6}
            placeholder="Preferencias, alergias, observaciones, historial relevante..."
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-border rounded-full text-sm font-medium text-dark hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              {isSaving ? 'Guardando...' : 'Guardar notas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============ Main Page ============

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [customer, setCustomer] = useState<CustomerWithOrders | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showEditInfo, setShowEditInfo] = useState(false)
  const [showEditNotes, setShowEditNotes] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [tagInput, setTagInput] = useState(false)

  const loadCustomer = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const data = await getCustomerById(id)
      if (!data) {
        router.push('/admin/clientes')
        return
      }
      setCustomer(data)
    } catch (error) {
      console.error('Error loading customer:', error)
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    loadCustomer()
  }, [loadCustomer])

  const handleSaveInfo = useCallback(
    async (data: Partial<CustomerFormData>) => {
      setIsSaving(true)
      try {
        const success = await updateCustomer(id, data)
        if (success) {
          setShowEditInfo(false)
          await loadCustomer()
        }
      } finally {
        setIsSaving(false)
      }
    },
    [id, loadCustomer]
  )

  const handleSaveNotes = useCallback(
    async (notes: string) => {
      setIsSaving(true)
      try {
        const success = await updateCustomer(id, { notes })
        if (success) {
          setShowEditNotes(false)
          await loadCustomer()
        }
      } finally {
        setIsSaving(false)
      }
    },
    [id, loadCustomer]
  )

  const handleAddTag = useCallback(async () => {
    const tag = newTag.trim()
    if (!tag || !customer) return
    if (customer.tags?.includes(tag)) {
      setNewTag('')
      return
    }
    setIsAddingTag(true)
    try {
      const success = await addCustomerTag(id, tag)
      if (success) {
        setNewTag('')
        setTagInput(false)
        await loadCustomer()
      }
    } finally {
      setIsAddingTag(false)
    }
  }, [id, newTag, customer, loadCustomer])

  const handleRemoveTag = useCallback(
    async (tag: string) => {
      const success = await removeCustomerTag(id, tag)
      if (success) await loadCustomer()
    },
    [id, loadCustomer]
  )

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Cargando..." subtitle="Detalle del cliente" />
        <div className="p-6 flex items-center justify-center min-h-64">
          <div className="text-center text-dark-light">
            <svg className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm">Cargando cliente...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!customer) return null

  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email
  const initials = (customer.first_name?.[0] || customer.email[0]).toUpperCase()

  // Derived stats from orders
  const completedOrders = customer.orders.filter(
    (o) => !['cancelled'].includes(o.status)
  )
  const lastOrder = customer.orders[0] ?? null
  const memberSince = formatDate(customer.created_at, { year: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen">
      <Header
        title={fullName}
        subtitle="Detalle del cliente"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm font-medium text-dark hover:bg-secondary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <button
              onClick={() => setShowEditInfo(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Top: Profile + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile card */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-border p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mb-3">
                <span className="font-display text-3xl font-bold text-primary">{initials}</span>
              </div>
              <h2 className="font-display text-xl font-bold text-dark">{fullName}</h2>
              <p className="text-sm text-dark-light mt-0.5">{customer.email}</p>
            </div>

            <div className="space-y-3 text-sm">
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-dark-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span className="text-dark">{customer.phone}</span>
                </div>
              )}

              {(customer.city || customer.address) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-dark-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    {customer.city && <p className="text-dark font-medium">{customer.city}</p>}
                    {customer.address && <p className="text-dark-light text-xs">{customer.address}</p>}
                  </div>
                </div>
              )}

              {customer.birthday && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-dark-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z" />
                    </svg>
                  </div>
                  <span className="text-dark">
                    {formatDate(customer.birthday + 'T12:00:00', { month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-dark-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-dark-light">Cliente desde {memberSince}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-dark-light text-sm">Total pedidos</p>
              <p className="text-4xl font-bold text-dark mt-2">{customer.total_orders}</p>
              <p className="text-xs text-dark-light mt-1">{completedOrders.length} completados</p>
            </div>

            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-dark-light text-sm">Total gastado</p>
              <p className="text-3xl font-bold text-accent mt-2">{formatCurrency(customer.total_spent)}</p>
              <p className="text-xs text-dark-light mt-1">
                {customer.total_orders > 0
                  ? `Promedio: ${formatCurrency(customer.total_spent / customer.total_orders)}`
                  : 'Sin pedidos aún'}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-dark-light text-sm">Último pedido</p>
              {lastOrder ? (
                <>
                  <p className="text-lg font-bold text-dark mt-2">{lastOrder.order_number}</p>
                  <p className="text-xs text-dark-light mt-1">
                    {formatDate(lastOrder.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </>
              ) : (
                <p className="text-dark-light mt-2 text-sm">Sin pedidos</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-dark-light text-sm">Evento más frecuente</p>
              <p className="text-lg font-bold text-dark mt-2 capitalize">
                {(() => {
                  const types = customer.orders
                    .map((o) => o.event_type)
                    .filter(Boolean) as string[]
                  if (types.length === 0) return '—'
                  const freq = types.reduce(
                    (acc, t) => ({ ...acc, [t]: (acc[t] || 0) + 1 }),
                    {} as Record<string, number>
                  )
                  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-dark">Etiquetas</h3>
            <button
              onClick={() => setTagInput((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar etiqueta
            </button>
          </div>

          {/* Tag Input */}
          {tagInput && (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                  if (e.key === 'Escape') {
                    setTagInput(false)
                    setNewTag('')
                  }
                }}
                placeholder="Nueva etiqueta..."
                autoFocus
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                onClick={handleAddTag}
                disabled={isAddingTag || !newTag.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
              >
                {isAddingTag ? '...' : 'Agregar'}
              </button>
              <button
                onClick={() => {
                  setTagInput(false)
                  setNewTag('')
                }}
                className="px-3 py-2 border border-border rounded-lg text-sm text-dark hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Tags */}
          {customer.tags && customer.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {customer.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
                    getTagColor(tag)
                  )}
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:opacity-60 transition-opacity"
                    title="Eliminar etiqueta"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dark-light">
              Sin etiquetas. Agrega etiquetas como VIP, Boda, Corporativo para organizar tus clientes.
            </p>
          )}
        </div>

        {/* Order History */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-display text-base font-semibold text-dark">
              Historial de pedidos
              {customer.orders.length > 0 && (
                <span className="ml-2 text-sm font-normal text-dark-light">
                  ({customer.orders.length} pedido{customer.orders.length !== 1 ? 's' : ''})
                </span>
              )}
            </h3>
          </div>

          {customer.orders.length === 0 ? (
            <div className="py-12 text-center text-dark-light">
              <svg className="w-10 h-10 mx-auto mb-3 text-dark-light/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">Este cliente aún no tiene pedidos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary text-xs text-dark-light uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Pedido</th>
                    <th className="text-left px-5 py-3 font-medium">Evento</th>
                    <th className="text-left px-5 py-3 font-medium">Fecha evento</th>
                    <th className="text-left px-5 py-3 font-medium">Estado</th>
                    <th className="text-left px-5 py-3 font-medium">Pago</th>
                    <th className="text-right px-5 py-3 font-medium">Total</th>
                    <th className="text-right px-5 py-3 font-medium">Registrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customer.orders.map((order) => {
                    const statusCfg = ORDER_STATUS_CONFIG[order.status] ?? {
                      label: order.status,
                      color: 'bg-gray-100 text-gray-600',
                    }
                    const paymentCfg = PAYMENT_STATUS_CONFIG[order.payment_status] ?? {
                      label: order.payment_status,
                      color: 'bg-gray-100 text-gray-600',
                    }

                    return (
                      <tr key={order.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-sm font-semibold text-dark">
                            {order.order_number}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-dark-light capitalize">
                          {order.event_type || <span className="text-dark-light/40">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-dark">
                          {formatDate(order.event_date + 'T12:00:00', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                              statusCfg.color
                            )}
                          >
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                              paymentCfg.color
                            )}
                          >
                            {paymentCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-accent">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-xs text-dark-light">
                          {formatDate(order.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-dark">Notas internas</h3>
            <button
              onClick={() => setShowEditNotes(true)}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar notas
            </button>
          </div>

          {customer.notes ? (
            <p className="text-sm text-dark leading-relaxed bg-secondary rounded-lg p-4">
              {customer.notes}
            </p>
          ) : (
            <button
              onClick={() => setShowEditNotes(true)}
              className="w-full py-8 border-2 border-dashed border-border rounded-lg text-dark-light text-sm hover:border-primary/40 hover:text-primary transition-colors"
            >
              Agregar notas sobre este cliente...
            </button>
          )}
        </div>
      </div>

      {/* Edit Info Modal */}
      {showEditInfo && (
        <EditInfoModal
          customer={customer}
          onClose={() => setShowEditInfo(false)}
          onSave={handleSaveInfo}
          isSaving={isSaving}
        />
      )}

      {/* Edit Notes Modal */}
      {showEditNotes && (
        <EditNotesModal
          notes={customer.notes ?? ''}
          onClose={() => setShowEditNotes(false)}
          onSave={handleSaveNotes}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}
