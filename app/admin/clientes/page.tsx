'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Header } from '@/components/admin/Header'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import {
  getCustomers,
  getCustomerStats,
  getCustomerTags,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer,
  type CustomerStats,
  type CustomerFormData,
} from '@/lib/supabase/customer-queries'

// ============ Tag Colors ============

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

// ============ Order Status Config ============

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  in_production: { label: 'En producción', color: 'bg-purple-100 text-purple-700' },
  ready: { label: 'Listo', color: 'bg-teal-100 text-teal-700' },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

// ============ Customer Form Modal ============

interface CustomerFormModalProps {
  customer: Customer | null
  onClose: () => void
  onSave: (data: CustomerFormData) => Promise<void>
  isSaving: boolean
}

function CustomerFormModal({ customer, onClose, onSave, isSaving }: CustomerFormModalProps) {
  const [form, setForm] = useState<CustomerFormData>({
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    first_name: customer?.first_name ?? '',
    last_name: customer?.last_name ?? '',
    address: customer?.address ?? '',
    city: customer?.city ?? '',
    notes: customer?.notes ?? '',
    birthday: customer?.birthday ?? '',
    tags: customer?.tags ?? [],
  })
  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({})

  const set = (field: keyof CustomerFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const addTag = () => {
    const tag = newTag.trim()
    if (!tag) return
    if ((form.tags || []).includes(tag)) {
      setNewTag('')
      return
    }
    setForm((prev) => ({ ...prev, tags: [...(prev.tags || []), tag] }))
    setNewTag('')
  }

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: (prev.tags || []).filter((t) => t !== tag) }))
  }

  const validate = (): boolean => {
    const errs: Partial<Record<keyof CustomerFormData, string>> = {}
    if (!form.email.trim()) errs.email = 'El email es requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email inválido'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="font-display text-xl font-bold text-dark">
            {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg text-dark-light hover:text-dark transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Nombre</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => set('first_name', e.target.value)}
                placeholder="Nombre"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Apellido</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => set('last_name', e.target.value)}
                placeholder="Apellido"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="correo@ejemplo.com"
              className={cn(
                'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30',
                errors.email ? 'border-red-400 focus:border-red-400' : 'border-border focus:border-primary'
              )}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Phone & City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+57 300 000 0000"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="Ciudad"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Birthday & Address */}
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
                placeholder="Dirección completa"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Etiquetas</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {(form.tags || []).map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                    getTagColor(tag)
                  )}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 hover:opacity-60 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Agregar etiqueta..."
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 border border-border rounded-lg text-sm text-dark hover:bg-secondary transition-colors"
              >
                Agregar
              </button>
            </div>
            <p className="text-xs text-dark-light mt-1">Ej: VIP, Boda, Cumpleaños, Corporativo</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Notas internas</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Preferencias, alergias, observaciones..."
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-border rounded-full text-sm font-medium text-dark hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Guardando...' : customer ? 'Actualizar' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============ Customer Detail Modal ============

interface CustomerDetailModalProps {
  customer: Customer
  onClose: () => void
  onEdit: (customer: Customer) => void
}

function CustomerDetailModal({ customer, onClose, onEdit }: CustomerDetailModalProps) {
  const fullName =
    [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold text-dark">Detalle del cliente</h2>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/clientes/${customer.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver completo
            </Link>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg text-dark-light hover:text-dark transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span className="font-display text-xl font-bold text-primary">
                {(customer.first_name?.[0] || customer.email[0]).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-dark">{fullName}</p>
              <p className="text-sm text-dark-light">{customer.email}</p>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {customer.phone && (
              <div>
                <p className="text-dark-light text-xs uppercase font-medium mb-0.5">Teléfono</p>
                <p className="text-dark">{customer.phone}</p>
              </div>
            )}
            {customer.city && (
              <div>
                <p className="text-dark-light text-xs uppercase font-medium mb-0.5">Ciudad</p>
                <p className="text-dark">{customer.city}</p>
              </div>
            )}
            {customer.birthday && (
              <div>
                <p className="text-dark-light text-xs uppercase font-medium mb-0.5">Cumpleaños</p>
                <p className="text-dark">
                  {formatDate(customer.birthday + 'T12:00:00', { month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}
            <div>
              <p className="text-dark-light text-xs uppercase font-medium mb-0.5">Cliente desde</p>
              <p className="text-dark">{formatDate(customer.created_at, { year: 'numeric', month: 'short' })}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-dark">{customer.total_orders}</p>
              <p className="text-xs text-dark-light mt-0.5">Pedidos</p>
            </div>
            <div className="bg-secondary rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-accent">{formatCurrency(customer.total_spent)}</p>
              <p className="text-xs text-dark-light mt-0.5">Total gastado</p>
            </div>
          </div>

          {/* Tags */}
          {customer.tags && customer.tags.length > 0 && (
            <div>
              <p className="text-dark-light text-xs uppercase font-medium mb-2">Etiquetas</p>
              <div className="flex flex-wrap gap-1.5">
                {customer.tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', getTagColor(tag))}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {customer.notes && (
            <div>
              <p className="text-dark-light text-xs uppercase font-medium mb-1">Notas</p>
              <p className="text-sm text-dark bg-secondary rounded-lg p-3">{customer.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => {
                onEdit(customer)
                onClose()
              }}
              className="flex-1 py-2 border border-border rounded-full text-sm font-medium text-dark hover:bg-secondary transition-colors"
            >
              Editar
            </button>
            <Link
              href={`/admin/clientes/${customer.id}`}
              onClick={onClose}
              className="flex-1 py-2 bg-primary text-white rounded-full text-sm font-medium text-center hover:bg-primary-hover transition-colors"
            >
              Ver historial
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ Main Page ============

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Más recientes' },
  { value: 'created_at_asc', label: 'Más antiguos' },
  { value: 'total_spent_desc', label: 'Mayor gasto' },
  { value: 'total_orders_desc', label: 'Más pedidos' },
  { value: 'name_asc', label: 'Nombre A-Z' },
]

const PAGE_SIZE = 20

export default function ClientesPage() {
  // Data
  const [customers, setCustomers] = useState<Customer[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    newThisMonth: 0,
    totalRevenue: 0,
    averagePerCustomer: 0,
  })
  const [allTags, setAllTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [sortValue, setSortValue] = useState('created_at_desc')
  const [page, setPage] = useState(1)

  // Modals
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)

  const parsedSort = useCallback(() => {
    const parts = sortValue.split('_')
    const dir = parts.pop() as 'asc' | 'desc'
    const field = parts.join('_') as 'name' | 'total_spent' | 'total_orders' | 'created_at'
    return { sortBy: field, sortDir: dir }
  }, [sortValue])

  const loadCustomers = useCallback(async () => {
    setIsLoading(true)
    try {
      const { sortBy, sortDir } = parsedSort()
      const { data, count } = await getCustomers({
        search: search || undefined,
        tag: tagFilter || undefined,
        sortBy,
        sortDir,
        page,
        pageSize: PAGE_SIZE,
      })
      setCustomers(data)
      setTotalCount(count)
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setIsLoading(false)
    }
  }, [search, tagFilter, sortValue, page, parsedSort])

  const loadMeta = useCallback(async () => {
    try {
      const [statsData, tags] = await Promise.all([getCustomerStats(), getCustomerTags()])
      setStats(statsData)
      setAllTags(tags)
    } catch (error) {
      console.error('Error loading meta:', error)
    }
  }, [])

  useEffect(() => {
    loadMeta()
  }, [loadMeta])

  useEffect(() => {
    setPage(1)
  }, [search, tagFilter, sortValue])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const handleSave = useCallback(
    async (data: CustomerFormData) => {
      setIsSaving(true)
      try {
        if (editingCustomer) {
          const success = await updateCustomer(editingCustomer.id, data)
          if (success) {
            setShowFormModal(false)
            setEditingCustomer(null)
            await Promise.all([loadCustomers(), loadMeta()])
          }
        } else {
          const created = await createCustomer(data)
          if (created) {
            setShowFormModal(false)
            await Promise.all([loadCustomers(), loadMeta()])
          }
        }
      } finally {
        setIsSaving(false)
      }
    },
    [editingCustomer, loadCustomers, loadMeta]
  )

  const handleDelete = useCallback(
    async (customer: Customer) => {
      const name =
        [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email
      if (!confirm(`¿Eliminar al cliente "${name}"? Esta acción no se puede deshacer.`)) return
      const success = await deleteCustomer(customer.id)
      if (success) {
        await Promise.all([loadCustomers(), loadMeta()])
      }
    },
    [loadCustomers, loadMeta]
  )

  const openNew = useCallback(() => {
    setEditingCustomer(null)
    setShowFormModal(true)
  }, [])

  const openEdit = useCallback((customer: Customer) => {
    setEditingCustomer(customer)
    setViewingCustomer(null)
    setShowFormModal(true)
  }, [])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="min-h-screen">
      <Header
        title="Clientes"
        subtitle="Gestión de clientes y CRM"
        actions={
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Cliente
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-light text-sm">Total Clientes</p>
                <p className="text-3xl font-bold text-dark mt-1">{stats.totalCustomers}</p>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-light text-sm">Nuevos este mes</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.newThisMonth}</p>
              </div>
              <div className="p-2.5 bg-green-50 rounded-lg">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-light text-sm">Revenue total</p>
                <p className="text-2xl font-bold text-accent mt-1">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-lg">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-light text-sm">Promedio por cliente</p>
                <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(stats.averagePerCustomer)}</p>
              </div>
              <div className="p-2.5 bg-pink-50 rounded-lg">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-light"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, email o teléfono..."
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Tag filter */}
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Todas las etiquetas</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortValue}
              onChange={(e) => setSortValue(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-dark-light">
              <svg
                className="w-8 h-8 mx-auto mb-3 animate-spin text-primary"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm">Cargando clientes...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="py-16 text-center text-dark-light">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-dark-light/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm font-medium">No se encontraron clientes</p>
              {(search || tagFilter) && (
                <button
                  onClick={() => {
                    setSearch('')
                    setTagFilter('')
                  }}
                  className="mt-2 text-primary text-sm hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
              {!search && !tagFilter && (
                <button onClick={openNew} className="mt-2 text-primary text-sm hover:underline">
                  Agregar primer cliente
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary text-xs text-dark-light uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Cliente</th>
                    <th className="text-left px-5 py-3 font-medium">Teléfono</th>
                    <th className="text-left px-5 py-3 font-medium">Ciudad</th>
                    <th className="text-center px-5 py-3 font-medium">Pedidos</th>
                    <th className="text-right px-5 py-3 font-medium">Total gastado</th>
                    <th className="text-left px-5 py-3 font-medium">Etiquetas</th>
                    <th className="text-center px-5 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((customer) => {
                    const fullName =
                      [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
                      customer.email
                    const initials = (customer.first_name?.[0] || customer.email[0]).toUpperCase()

                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-secondary/40 transition-colors cursor-pointer"
                        onClick={() => setViewingCustomer(customer)}
                      >
                        {/* Name / Email */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-primary">{initials}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-dark text-sm truncate">{fullName}</p>
                              <p className="text-xs text-dark-light truncate">{customer.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-5 py-3.5 text-sm text-dark-light">
                          {customer.phone || <span className="text-dark-light/40">—</span>}
                        </td>

                        {/* City */}
                        <td className="px-5 py-3.5 text-sm text-dark-light">
                          {customer.city || <span className="text-dark-light/40">—</span>}
                        </td>

                        {/* Orders */}
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={cn(
                              'inline-block text-sm font-semibold px-2.5 py-0.5 rounded-full',
                              customer.total_orders > 0
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-secondary text-dark-light'
                            )}
                          >
                            {customer.total_orders}
                          </span>
                        </td>

                        {/* Total spent */}
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-accent">
                          {customer.total_spent > 0 ? (
                            formatCurrency(customer.total_spent)
                          ) : (
                            <span className="text-dark-light/40 font-normal">—</span>
                          )}
                        </td>

                        {/* Tags */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {(customer.tags || []).slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-xs font-medium',
                                  getTagColor(tag)
                                )}
                              >
                                {tag}
                              </span>
                            ))}
                            {(customer.tags || []).length > 3 && (
                              <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-secondary text-dark-light">
                                +{customer.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              href={`/admin/clientes/${customer.id}`}
                              className="p-1.5 hover:bg-secondary rounded-lg text-dark-light hover:text-primary transition-colors"
                              title="Ver detalle"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => openEdit(customer)}
                              className="p-1.5 hover:bg-secondary rounded-lg text-dark-light hover:text-dark transition-colors"
                              title="Editar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(customer)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-dark-light hover:text-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalCount > PAGE_SIZE && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-secondary/30">
              <p className="text-sm text-dark-light">
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} de{' '}
                {totalCount} clientes
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-border text-dark-light hover:bg-white hover:text-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-dark px-1">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-border text-dark-light hover:bg-white hover:text-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => {
            setShowFormModal(false)
            setEditingCustomer(null)
          }}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {/* Detail Modal */}
      {viewingCustomer && (
        <CustomerDetailModal
          customer={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
          onEdit={openEdit}
        />
      )}
    </div>
  )
}
