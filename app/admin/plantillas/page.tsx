'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Header } from '@/components/admin/Header'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import {
  getMessageTemplates,
  saveMessageTemplates,
  type MessageTemplate,
  type MessageTemplateSet,
} from '@/lib/supabase/template-queries'

// ---------------------------------------------------------------------------
// Sample data for the preview panel
// ---------------------------------------------------------------------------
const SAMPLE_VALUES: Record<string, string> = {
  cliente_nombre: 'María González',
  numero_pedido: 'DD-2026-001',
  fecha_evento: '15 de marzo de 2026',
  hora_evento: '18:00',
  total: '$150.000',
  servicios: 'Torta de chocolate 3 pisos, Mini pasteles x20',
  estado_anterior: 'Confirmado',
  estado_nuevo: 'En producción',
  tipo_entrega: 'Delivery',
  direccion_entrega: 'Av. Providencia 1234, Santiago',
  numero_cotizacion: 'COT-2026-005',
  precio_estimado: '$220.000',
  descripcion: 'Torta temática 4 pisos, cobertura fondant, decoración floral',
}

function applyPreview(body: string): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => SAMPLE_VALUES[key] ?? `{{${key}}}`)
}

// ---------------------------------------------------------------------------
// Channel badge
// ---------------------------------------------------------------------------
type Channel = 'email' | 'whatsapp' | 'both'

function ChannelBadge({ channel }: { channel: Channel }) {
  const map: Record<Channel, { label: string; className: string }> = {
    email: { label: 'Email', className: 'bg-blue-100 text-blue-700' },
    whatsapp: { label: 'WhatsApp', className: 'bg-green-100 text-green-700' },
    both: { label: 'Ambos', className: 'bg-purple-100 text-purple-700' },
  }
  const { label, className } = map[channel]
  return (
    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', className)}>
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Variable badge
// ---------------------------------------------------------------------------
function VariableBadge({
  variable,
  onClick,
}: {
  variable: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 text-xs cursor-pointer hover:bg-amber-200 transition-colors font-mono"
    >
      {`{{${variable}}}`}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30',
        checked ? 'bg-primary' : 'bg-gray-200'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Edit modal
// ---------------------------------------------------------------------------
interface EditModalProps {
  template: MessageTemplate
  onSave: (updated: MessageTemplate) => void
  onClose: () => void
}

function EditModal({ template, onSave, onClose }: EditModalProps) {
  const [draft, setDraft] = useState<MessageTemplate>({ ...template })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertVariable = useCallback((variable: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const insertion = `{{${variable}}}`
    const newBody =
      draft.body.substring(0, start) + insertion + draft.body.substring(end)
    setDraft((prev) => ({ ...prev, body: newBody }))
    // Restore cursor after insertion
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + insertion.length, start + insertion.length)
    })
  }, [draft.body])

  const handleSave = () => {
    onSave(draft)
  }

  const showSubject = draft.channel === 'email' || draft.channel === 'both'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg font-bold text-dark">{draft.name}</h2>
            <ChannelBadge channel={draft.channel} />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary text-dark-light hover:text-dark transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left column: editor */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 border-r border-border">
            {/* Subject (email only) */}
            {showSubject && (
              <div>
                <label className="block text-sm font-medium text-dark mb-1">
                  Asunto del correo
                </label>
                <input
                  type="text"
                  value={draft.subject ?? ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, subject: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Asunto del email..."
                />
              </div>
            )}

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-dark mb-1">
                Cuerpo del mensaje
              </label>
              <textarea
                ref={textareaRef}
                value={draft.body}
                onChange={(e) => setDraft((prev) => ({ ...prev, body: e.target.value }))}
                rows={12}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y leading-relaxed"
                placeholder="Escribe el mensaje aquí..."
              />
            </div>

            {/* Variables panel */}
            <div>
              <p className="text-xs font-semibold text-dark-light uppercase tracking-wide mb-2">
                Variables disponibles — haz clic para insertar
              </p>
              <div className="flex flex-wrap gap-2">
                {draft.variables.map((v) => (
                  <VariableBadge
                    key={v}
                    variable={v}
                    onClick={() => insertVariable(v)}
                  />
                ))}
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3 pt-2">
              <Toggle
                checked={draft.isActive}
                onChange={(v) => setDraft((prev) => ({ ...prev, isActive: v }))}
              />
              <span className="text-sm text-dark">
                {draft.isActive ? 'Plantilla activa' : 'Plantilla inactiva'}
              </span>
            </div>
          </div>

          {/* Right column: preview */}
          <div className="w-80 flex-shrink-0 overflow-y-auto p-6 bg-secondary">
            <p className="text-xs font-semibold text-dark-light uppercase tracking-wide mb-3">
              Vista previa con datos de ejemplo
            </p>

            {showSubject && draft.subject && (
              <div className="mb-3">
                <p className="text-xs text-dark-light font-medium mb-1">Asunto:</p>
                <p className="text-sm text-dark font-medium bg-white rounded-lg px-3 py-2 border border-border">
                  {applyPreview(draft.subject)}
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-border px-4 py-3">
              <p className="text-sm text-dark whitespace-pre-wrap leading-relaxed">
                {applyPreview(draft.body)}
              </p>
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0 bg-white">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Template card
// ---------------------------------------------------------------------------
interface TemplateCardProps {
  template: MessageTemplate
  onEdit: (template: MessageTemplate) => void
  onToggleActive: (id: string, value: boolean) => void
}

function TemplateCard({ template, onEdit, onToggleActive }: TemplateCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-dark text-base leading-tight">{template.name}</h3>
        </div>
        <ChannelBadge channel={template.channel} />
      </div>

      {/* Body preview */}
      <p className="text-sm text-dark-light leading-relaxed line-clamp-3 font-mono">
        {template.body}
      </p>

      {/* Variables */}
      {template.variables.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {template.variables.map((v) => (
            <VariableBadge key={v} variable={v} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border mt-auto">
        <div className="flex items-center gap-2.5">
          <Toggle
            checked={template.isActive}
            onChange={(v) => onToggleActive(template.id, v)}
          />
          <span className="text-xs text-dark-light">
            {template.isActive ? 'Activa' : 'Inactiva'}
          </span>
        </div>
        <button
          onClick={() => onEdit(template)}
          className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/10"
        >
          Editar
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------
type FilterTab = 'all' | 'email' | 'whatsapp'

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'email', label: 'Email' },
  { id: 'whatsapp', label: 'WhatsApp' },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function PlantillasPage() {
  const [templateSet, setTemplateSet] = useState<MessageTemplateSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    getMessageTemplates().then((data) => {
      setTemplateSet(data)
      setLoading(false)
    })
  }, [])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setErrorMsg(null)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const showError = (msg: string) => {
    setErrorMsg(msg)
    setSuccessMsg(null)
    setTimeout(() => setErrorMsg(null), 4000)
  }

  const handleToggleActive = async (id: string, value: boolean) => {
    if (!templateSet) return
    const updated: MessageTemplateSet = {
      ...templateSet,
      templates: templateSet.templates.map((t) =>
        t.id === id ? { ...t, isActive: value } : t
      ),
    }
    setTemplateSet(updated)
    setSaving(true)
    const { error } = await saveMessageTemplates(updated)
    setSaving(false)
    if (error) {
      showError('Error al guardar. Intenta nuevamente.')
    } else {
      showSuccess('Estado actualizado correctamente.')
    }
  }

  const handleSaveEdit = async (updated: MessageTemplate) => {
    if (!templateSet) return
    const newSet: MessageTemplateSet = {
      ...templateSet,
      templates: templateSet.templates.map((t) =>
        t.id === updated.id ? updated : t
      ),
    }
    setTemplateSet(newSet)
    setEditingTemplate(null)
    setSaving(true)
    const { error } = await saveMessageTemplates(newSet)
    setSaving(false)
    if (error) {
      showError('Error al guardar los cambios.')
    } else {
      showSuccess('Plantilla guardada correctamente.')
    }
  }

  const filteredTemplates =
    templateSet?.templates.filter((t) => {
      if (activeFilter === 'all') return true
      if (activeFilter === 'email') return t.channel === 'email' || t.channel === 'both'
      if (activeFilter === 'whatsapp') return t.channel === 'whatsapp' || t.channel === 'both'
      return true
    }) ?? []

  return (
    <div className="min-h-screen bg-light-alt">
      <Header
        title="Plantillas de Mensajes"
        subtitle="Personaliza los mensajes automáticos enviados a tus clientes"
      />

      <div className="p-6 max-w-6xl mx-auto">
        {/* Toast notifications */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-3 bg-success/10 border border-success text-success-dark px-4 py-3 rounded-xl text-sm font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errorMsg}
          </div>
        )}

        {/* Filter tabs + saving indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center bg-white border border-border rounded-xl p-1 gap-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeFilter === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-dark-light hover:text-dark hover:bg-secondary'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {saving && (
            <div className="flex items-center gap-2 text-sm text-dark-light">
              <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Guardando...
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-3 bg-gray-100 rounded mb-2" />
                <div className="h-3 bg-gray-100 rounded mb-2 w-4/5" />
                <div className="h-3 bg-gray-100 rounded w-3/5" />
              </div>
            ))}
          </div>
        )}

        {/* Template grid */}
        {!loading && filteredTemplates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={setEditingTemplate}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredTemplates.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-12 h-12 text-dark-light mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-dark-light text-sm">No hay plantillas para este canal.</p>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingTemplate && (
        <EditModal
          template={editingTemplate}
          onSave={handleSaveEdit}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  )
}
