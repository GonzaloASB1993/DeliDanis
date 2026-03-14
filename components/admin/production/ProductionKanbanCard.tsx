'use client'

import { cn } from '@/lib/utils/cn'
import type { ProductionOrder } from '@/lib/supabase/production-queries'

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  cake: 'Torta',
  cocktail: 'Cocteleria',
  pastry: 'Pasteleria',
}

const PRODUCT_TYPE_COLORS: Record<string, string> = {
  cake: 'bg-pink-100 text-pink-700',
  cocktail: 'bg-cyan-100 text-cyan-700',
  pastry: 'bg-amber-100 text-amber-700',
}

function getUrgencyLevel(order: ProductionOrder): 'overdue' | 'today' | 'soon' | 'normal' {
  if (!order.order?.event_date) return 'normal'
  const eventDate = new Date(order.order.event_date + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'today'
  if (diffDays <= 2) return 'soon'
  return 'normal'
}

const URGENCY_BORDER: Record<string, string> = {
  overdue: 'border-l-4 border-l-red-500',
  today: 'border-l-4 border-l-red-400',
  soon: 'border-l-4 border-l-orange-400',
  normal: 'border-l-4 border-l-transparent',
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (diffMin < 1) return 'justo ahora'
  if (diffMin < 60) return `hace ${diffMin}min`
  if (diffHrs < 24) return `hace ${diffHrs}h`
  return `hace ${diffDays}d`
}

interface ProductionKanbanCardProps {
  order: ProductionOrder
  selected: boolean
  onSelect: (id: string) => void
  onDetail: () => void
  onAction?: () => void
  onCancel?: () => void
  actionLabel?: string
  actionColor?: string
}

export function ProductionKanbanCard({
  order,
  selected,
  onSelect,
  onDetail,
  onAction,
  onCancel,
  actionLabel,
  actionColor,
}: ProductionKanbanCardProps) {
  const urgency = getUrgencyLevel(order)
  const eventDate = order.order?.event_date
    ? new Date(order.order.event_date + 'T00:00:00')
    : null

  return (
    <div
      className={cn(
        'bg-white border rounded-lg transition-all hover:shadow-sm',
        URGENCY_BORDER[urgency],
        selected && 'ring-2 ring-primary/40 bg-primary/5'
      )}
    >
      {/* Content area - clickable */}
      <div className="p-3 cursor-pointer" onClick={onDetail}>
        {/* Header: checkbox + name + quantity */}
        <div className="flex items-start gap-2 mb-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={e => {
              e.stopPropagation()
              onSelect(order.id)
            }}
            onClick={e => e.stopPropagation()}
            className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-dark text-sm truncate">{order.product_name}</p>
            {order.quantity > 1 && (
              <p className="text-xs text-dark-light">x{order.quantity}</p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="text-[10px] font-mono bg-gray-100 text-dark-light px-1.5 py-0.5 rounded">
            {order.sku}
          </span>
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', PRODUCT_TYPE_COLORS[order.product_type] || 'bg-gray-100 text-gray-600')}>
            {PRODUCT_TYPE_LABELS[order.product_type] || order.product_type}
          </span>
          {order.order?.order_number && (
            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
              {order.order.order_number}
            </span>
          )}
        </div>

        {/* Event date */}
        {eventDate && (
          <div className={cn(
            'flex items-center gap-1.5 mb-1.5 text-xs',
            urgency === 'overdue' ? 'text-red-600 font-semibold' :
            urgency === 'today' ? 'text-red-500 font-medium' :
            urgency === 'soon' ? 'text-orange-600' :
            'text-dark-light'
          )}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              {urgency === 'overdue' ? 'Vencido - ' : urgency === 'today' ? 'Hoy - ' : ''}
              {eventDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        )}

        {/* Relative time */}
        <p className="text-[10px] text-dark-light">
          {order.status === 'in_progress' && order.started_at
            ? `En proceso ${getRelativeTime(order.started_at)}`
            : `Creado ${getRelativeTime(order.created_at)}`
          }
        </p>
      </div>

      {/* Actions - separated */}
      {(onAction || onCancel) && (
        <div className="flex gap-2 px-3 pb-3 pt-2 border-t border-border/50">
          {onAction && (
            <button
              onClick={e => { e.stopPropagation(); onAction() }}
              className={cn(
                'flex-1 text-xs text-white py-1.5 rounded-md font-medium transition-colors',
                actionColor || 'bg-primary hover:bg-primary-hover'
              )}
            >
              {actionLabel}
            </button>
          )}
          {onCancel && (
            <button
              onClick={e => { e.stopPropagation(); onCancel() }}
              className="px-3 text-xs text-red-600 py-1.5 rounded-md font-medium hover:bg-red-50 transition-colors border border-red-200"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
