'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/admin/Header'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonialActive,
  toggleTestimonialFeatured,
  reorderTestimonials,
  approveTestimonial,
  rejectTestimonial,
  type Testimonial,
  type TestimonialInsert,
} from '@/lib/supabase/testimonial-queries'

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  'Matrimonio',
  'Cumpleaños',
  'Bautizo',
  'Quinceañero',
  'Corporativo',
  'Baby Shower',
  'Graduación',
  'Otro',
]

type FilterType = 'todos' | 'activos' | 'inactivos' | 'destacados' | 'pendientes'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deriveInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function avgRating(list: Testimonial[]): string {
  if (!list.length) return '—'
  const sum = list.reduce((acc, t) => acc + t.rating, 0)
  return (sum / list.length).toFixed(1)
}

// ─── Star components ──────────────────────────────────────────────────────────

function StarFilled({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function StarRating({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <StarFilled key={i} className={i < count ? 'text-amber-400' : 'text-gray-200'} />
      ))}
    </div>
  )
}

function ClickableStars({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1
        const active = star <= (hovered || value)
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none"
            aria-label={`${star} estrella${star !== 1 ? 's' : ''}`}
          >
            <StarFilled className={active ? 'text-amber-400' : 'text-gray-200'} />
          </button>
        )
      })}
    </div>
  )
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-primary' : 'bg-gray-300'
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        )}
      />
    </button>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 flex items-center gap-4">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-dark-light font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-dark leading-none mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ─── Testimonial Form Modal ────────────────────────────────────────────────────

interface FormState {
  customer_name: string
  customer_initials: string
  event_type: string
  comment: string
  rating: number
  is_active: boolean
  is_featured: boolean
}

const EMPTY_FORM: FormState = {
  customer_name: '',
  customer_initials: '',
  event_type: EVENT_TYPES[0],
  comment: '',
  rating: 5,
  is_active: true,
  is_featured: false,
}

interface TestimonialModalProps {
  open: boolean
  editing: Testimonial | null
  onClose: () => void
  onSaved: (t: Testimonial) => void
}

function TestimonialModal({ open, editing, onClose, onSaved }: TestimonialModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        customer_name: editing.customer_name,
        customer_initials: editing.customer_initials ?? '',
        event_type: editing.event_type ?? EVENT_TYPES[0],
        comment: editing.comment,
        rating: editing.rating,
        is_active: editing.is_active,
        is_featured: editing.is_featured,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
  }, [open, editing])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Auto-derive initials when name changes (only if initials not manually edited)
      if (key === 'customer_name' && typeof value === 'string') {
        const autoInitials = deriveInitials(value)
        const currentAutoInitials = deriveInitials(prev.customer_name)
        if (prev.customer_initials === currentAutoInitials || prev.customer_initials === '') {
          next.customer_initials = autoInitials
        }
      }
      return next
    })
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validate = (): boolean => {
    const errs: typeof errors = {}
    if (!form.customer_name.trim()) errs.customer_name = 'El nombre es requerido'
    if (!form.comment.trim()) errs.comment = 'El comentario es requerido'
    if (form.comment.trim().length < 10) errs.comment = 'El comentario es demasiado corto'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    const payload: TestimonialInsert = {
      customer_name: form.customer_name.trim(),
      customer_initials: form.customer_initials.trim() || deriveInitials(form.customer_name),
      event_type: form.event_type || null,
      comment: form.comment.trim(),
      rating: form.rating,
      is_active: form.is_active,
      is_featured: form.is_featured,
      order_index: editing?.order_index ?? 999,
      // Fields added by migration 017 — admin-created testimonials are approved by default
      status: 'approved',
      customer_email: null,
      image_urls: [],
      admin_response: null,
    }

    const result = editing
      ? await updateTestimonial(editing.id, payload)
      : await createTestimonial(payload)

    setSaving(false)

    if (result.error) {
      setErrors({ comment: result.error })
      return
    }

    if (result.data) {
      onSaved(result.data)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold text-dark">
            {editing ? 'Editar Testimonio' : 'Nuevo Testimonio'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary text-dark-light transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Customer name */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Nombre del cliente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.customer_name}
              onChange={(e) => setField('customer_name', e.target.value)}
              placeholder="Ej. Maria Gonzalez"
              className={cn(
                'w-full border rounded-lg px-3 py-2 text-sm text-dark placeholder-dark-light/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition',
                errors.customer_name ? 'border-red-400' : 'border-border'
              )}
            />
            {errors.customer_name && (
              <p className="text-xs text-red-500 mt-1">{errors.customer_name}</p>
            )}
          </div>

          {/* Initials + Event type — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Iniciales</label>
              <input
                type="text"
                value={form.customer_initials}
                onChange={(e) => setField('customer_initials', e.target.value.toUpperCase().slice(0, 5))}
                placeholder="MG"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark placeholder-dark-light/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Tipo de evento</label>
              <select
                value={form.event_type}
                onChange={(e) => setField('event_type', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 transition bg-white"
              >
                {EVENT_TYPES.map((et) => (
                  <option key={et} value={et}>{et}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Comentario <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.comment}
              onChange={(e) => setField('comment', e.target.value)}
              rows={4}
              placeholder="¿Qué dijo el cliente sobre su experiencia?"
              className={cn(
                'w-full border rounded-lg px-3 py-2 text-sm text-dark placeholder-dark-light/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none',
                errors.comment ? 'border-red-400' : 'border-border'
              )}
            />
            {errors.comment && (
              <p className="text-xs text-red-500 mt-1">{errors.comment}</p>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">Calificacion</label>
            <ClickableStars value={form.rating} onChange={(v) => setField('rating', v)} />
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between py-3 border-t border-border">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <Toggle
                  checked={form.is_active}
                  onChange={(v) => setField('is_active', v)}
                />
                <span className="text-sm text-dark">Activo</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Toggle
                  checked={form.is_featured}
                  onChange={(v) => setField('is_featured', v)}
                />
                <span className="text-sm text-dark">Destacado</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" isLoading={saving}>
              {editing ? 'Guardar cambios' : 'Crear testimonio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({
  target,
  onClose,
  onConfirm,
}: {
  target: Testimonial | null
  onClose: () => void
  onConfirm: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  if (!target) return null

  const handleConfirm = async () => {
    setDeleting(true)
    await onConfirm()
    setDeleting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-dark/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-dark">Eliminar testimonio</h3>
            <p className="text-sm text-dark-light mt-0.5">
              Esta accion no se puede deshacer.
            </p>
          </div>
        </div>
        <p className="text-sm text-dark mb-5">
          Se eliminara el testimonio de <strong>{target.customer_name}</strong> de forma permanente.
        </p>
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────

interface TestimonialCardProps {
  testimonial: Testimonial
  index: number
  total: number
  onEdit: (t: Testimonial) => void
  onDelete: (t: Testimonial) => void
  onToggleActive: (t: Testimonial) => void
  onToggleFeatured: (t: Testimonial) => void
  onMoveUp: (t: Testimonial) => void
  onMoveDown: (t: Testimonial) => void
  onApprove: (t: Testimonial) => void
  onReject: (t: Testimonial, reason: string) => void
  toggling: boolean
}

function TestimonialCard({
  testimonial: t,
  index,
  total,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleFeatured,
  onMoveUp,
  onMoveDown,
  onApprove,
  onReject,
  toggling,
}: TestimonialCardProps) {
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const truncated = t.comment.length > 140 ? t.comment.slice(0, 137) + '...' : t.comment
  const status = (t as Testimonial & { status?: string }).status
  const customerEmail = (t as Testimonial & { customer_email?: string }).customer_email
  const imageUrls: string[] = (t as Testimonial & { image_urls?: string[] }).image_urls ?? []
  const adminResponse = (t as Testimonial & { admin_response?: string }).admin_response

  const handleRejectConfirm = () => {
    onReject(t, rejectReason)
    setShowRejectInput(false)
    setRejectReason('')
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-5 transition-shadow hover:shadow-md flex flex-col gap-4',
        t.is_active ? 'border-border' : 'border-dashed border-border opacity-70'
      )}
    >
      {/* Top row: rating + badges */}
      <div className="flex items-start justify-between gap-2">
        <StarRating count={t.rating} />
        <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
          {t.is_featured && (
            <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
              Destacado
            </span>
          )}
          {status === 'pending' && (
            <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">
              Pendiente
            </span>
          )}
          {status === 'rejected' && (
            <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
              Rechazado
            </span>
          )}
          {status === 'approved' && (
            <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
              Aprobado
            </span>
          )}
          {!status && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              )}
            >
              {t.is_active ? 'Activo' : 'Inactivo'}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <p className="text-sm text-dark-light leading-relaxed italic flex-1">
        &ldquo;{truncated}&rdquo;
      </p>

      {/* Rejection reason (if rejected) */}
      {status === 'rejected' && adminResponse && (
        <p className="text-xs text-red-500 italic">
          Motivo: {adminResponse}
        </p>
      )}

      {/* Image thumbnails */}
      {imageUrls.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {imageUrls.slice(0, 3).map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Imagen ${i + 1}`}
              className="w-12 h-12 rounded-lg object-cover border border-border"
            />
          ))}
          {imageUrls.length > 3 && (
            <div className="w-12 h-12 rounded-lg border border-border bg-secondary flex items-center justify-center">
              <span className="text-xs text-dark-light font-medium">+{imageUrls.length - 3}</span>
            </div>
          )}
        </div>
      )}

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">
            {t.customer_initials || deriveInitials(t.customer_name)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-dark truncate">{t.customer_name}</p>
          {customerEmail && (
            <p className="text-xs text-dark-light truncate">{customerEmail}</p>
          )}
          {t.event_type && !customerEmail && (
            <p className="text-xs text-dark-light">{t.event_type}</p>
          )}
          {t.event_type && customerEmail && (
            <p className="text-xs text-dark-light">{t.event_type}</p>
          )}
        </div>
      </div>

      {/* Pending approval actions */}
      {status === 'pending' && (
        <div className="flex flex-col gap-2">
          {!showRejectInput ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onApprove(t)}
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              >
                Aprobar
              </button>
              <button
                type="button"
                onClick={() => setShowRejectInput(true)}
                className="bg-red-100 text-red-600 hover:bg-red-200 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              >
                Rechazar
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motivo de rechazo (opcional)"
                className="w-full border border-border rounded-lg px-3 py-1.5 text-xs text-dark placeholder-dark-light/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRejectConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                >
                  Confirmar rechazo
                </button>
                <button
                  type="button"
                  onClick={() => { setShowRejectInput(false); setRejectReason('') }}
                  className="bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Controls row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Toggles */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Toggle
              checked={t.is_active}
              onChange={() => onToggleActive(t)}
              disabled={toggling}
            />
            <span className="text-xs text-dark-light">Activo</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Toggle
              checked={t.is_featured}
              onChange={() => onToggleFeatured(t)}
              disabled={toggling}
            />
            <span className="text-xs text-dark-light">Destacado</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Reorder up */}
          <button
            type="button"
            onClick={() => onMoveUp(t)}
            disabled={index === 0}
            title="Subir orden"
            className="p-1.5 rounded-lg text-dark-light hover:text-dark hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* Reorder down */}
          <button
            type="button"
            onClick={() => onMoveDown(t)}
            disabled={index === total - 1}
            title="Bajar orden"
            className="p-1.5 rounded-lg text-dark-light hover:text-dark hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit(t)}
            title="Editar"
            className="p-1.5 rounded-lg text-dark-light hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(t)}
            title="Eliminar"
            className="p-1.5 rounded-lg text-dark-light hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TestimoniosAdminPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('todos')
  const [toggling, setToggling] = useState(false)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null)

  // Load data
  const loadTestimonials = useCallback(async () => {
    setLoading(true)
    const data = await getTestimonials()
    setTestimonials(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadTestimonials()
  }, [loadTestimonials])

  // Derived stats
  const total = testimonials.length
  const activeCount = testimonials.filter((t) => t.is_active).length
  const featuredCount = testimonials.filter((t) => t.is_featured).length
  const rating = avgRating(testimonials)
  const pendingCount = testimonials.filter(
    (t) => (t as Testimonial & { status?: string }).status === 'pending'
  ).length

  // Filtered list for display
  const filtered = testimonials.filter((t) => {
    const status = (t as Testimonial & { status?: string }).status
    if (filter === 'activos') return t.is_active
    if (filter === 'inactivos') return !t.is_active
    if (filter === 'destacados') return t.is_featured
    if (filter === 'pendientes') return status === 'pending'
    return true
  })

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenNew = () => {
    setEditingItem(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (t: Testimonial) => {
    setEditingItem(t)
    setModalOpen(true)
  }

  const handleSaved = (saved: Testimonial) => {
    setTestimonials((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id)
      if (idx !== -1) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
    setModalOpen(false)
  }

  const handleToggleActive = async (t: Testimonial) => {
    setToggling(true)
    const next = !t.is_active
    setTestimonials((prev) =>
      prev.map((item) => (item.id === t.id ? { ...item, is_active: next } : item))
    )
    const { error } = await toggleTestimonialActive(t.id, next)
    if (error) {
      // Roll back
      setTestimonials((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, is_active: t.is_active } : item))
      )
    }
    setToggling(false)
  }

  const handleToggleFeatured = async (t: Testimonial) => {
    setToggling(true)
    const next = !t.is_featured
    setTestimonials((prev) =>
      prev.map((item) => (item.id === t.id ? { ...item, is_featured: next } : item))
    )
    const { error } = await toggleTestimonialFeatured(t.id, next)
    if (error) {
      setTestimonials((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, is_featured: t.is_featured } : item))
      )
    }
    setToggling(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await deleteTestimonial(deleteTarget.id)
    if (!error) {
      setTestimonials((prev) => prev.filter((t) => t.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  const handleApprove = async (t: Testimonial) => {
    // Optimistic update
    setTestimonials((prev) =>
      prev.map((item) =>
        item.id === t.id
          ? { ...item, status: 'approved', is_active: true } as Testimonial & { status: string }
          : item
      )
    )
    const { error } = await approveTestimonial(t.id)
    if (error) {
      // Rollback
      setTestimonials((prev) =>
        prev.map((item) => (item.id === t.id ? t : item))
      )
    }
  }

  const handleReject = async (t: Testimonial, reason: string) => {
    // Optimistic update
    setTestimonials((prev) =>
      prev.map((item) =>
        item.id === t.id
          ? { ...item, status: 'rejected', admin_response: reason } as Testimonial & { status: string; admin_response: string }
          : item
      )
    )
    const { error } = await rejectTestimonial(t.id, reason)
    if (error) {
      // Rollback
      setTestimonials((prev) =>
        prev.map((item) => (item.id === t.id ? t : item))
      )
    }
  }

  const handleMoveUp = async (t: Testimonial) => {
    const allIds = testimonials.map((item) => item.id)
    const idx = allIds.indexOf(t.id)
    if (idx <= 0) return

    const newOrder = [...allIds]
    ;[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]

    const newList = newOrder.map((id, i) => {
      const item = testimonials.find((x) => x.id === id)!
      return { ...item, order_index: i }
    })
    setTestimonials(newList)

    await reorderTestimonials(newOrder)
  }

  const handleMoveDown = async (t: Testimonial) => {
    const allIds = testimonials.map((item) => item.id)
    const idx = allIds.indexOf(t.id)
    if (idx < 0 || idx >= allIds.length - 1) return

    const newOrder = [...allIds]
    ;[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]]

    const newList = newOrder.map((id, i) => {
      const item = testimonials.find((x) => x.id === id)!
      return { ...item, order_index: i }
    })
    setTestimonials(newList)

    await reorderTestimonials(newOrder)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'activos', label: 'Activos' },
    { key: 'inactivos', label: 'Inactivos' },
    { key: 'destacados', label: 'Destacados' },
    { key: 'pendientes', label: 'Pendientes' },
  ]

  return (
    <div className="min-h-screen bg-light-alt">
      <Header
        title="Testimonios"
        subtitle="Administra las resenas de clientes que aparecen en el sitio"
        actions={
          <Button size="sm" onClick={handleOpenNew} className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Testimonio
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total"
            value={total}
            color="bg-primary/10"
            icon={
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
          />
          <StatCard
            label="Activos"
            value={activeCount}
            color="bg-green-100"
            icon={
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Destacados"
            value={featuredCount}
            color="bg-amber-100"
            icon={
              <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            }
          />
          <StatCard
            label="Rating promedio"
            value={rating}
            color="bg-info/10"
            icon={
              <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatCard
            label="Pendientes"
            value={pendingCount}
            color="bg-orange-100"
            icon={
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                filter === key
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-dark-light hover:text-dark hover:border-dark/30'
              )}
            >
              {label}
              {key === 'todos' && total > 0 && (
                <span className={cn('ml-1.5 text-xs', filter === key ? 'text-white/70' : 'text-dark-light')}>
                  {total}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-5 h-56 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-24 mb-4" />
                <div className="space-y-2 mb-6">
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-4/5" />
                  <div className="h-3 bg-gray-100 rounded w-3/5" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100" />
                  <div className="space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-24" />
                    <div className="h-2.5 bg-gray-100 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <svg className="w-14 h-14 mx-auto text-dark-light/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-dark font-semibold mb-1">
              {filter === 'todos' ? 'No hay testimonios aun' : `No hay testimonios ${filter}`}
            </h3>
            <p className="text-sm text-dark-light mb-5">
              {filter === 'todos'
                ? 'Crea el primer testimonio para que aparezca en el sitio publico.'
                : 'Prueba cambiando el filtro activo.'}
            </p>
            {filter === 'todos' && (
              <Button size="sm" onClick={handleOpenNew}>
                Agregar testimonio
              </Button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <TestimonialCard
                key={t.id}
                testimonial={t}
                index={testimonials.indexOf(t)}
                total={testimonials.length}
                onEdit={handleOpenEdit}
                onDelete={setDeleteTarget}
                onToggleActive={handleToggleActive}
                onToggleFeatured={handleToggleFeatured}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onApprove={handleApprove}
                onReject={handleReject}
                toggling={toggling}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TestimonialModal
        open={modalOpen}
        editing={editingItem}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />

      <DeleteModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
