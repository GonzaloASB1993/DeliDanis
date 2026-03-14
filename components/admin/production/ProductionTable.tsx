'use client'

import { cn } from '@/lib/utils/cn'
import type { ProductionOrder, ProductionFilters } from '@/lib/supabase/production-queries'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En Proceso',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

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

function isOverdue(order: ProductionOrder): boolean {
  if (!order.order?.event_date) return false
  if (order.status === 'completed' || order.status === 'cancelled') return false
  const today = new Date().toISOString().split('T')[0]
  return order.order.event_date <= today
}

interface ProductionTableProps {
  orders: ProductionOrder[]
  selectedIds: Set<string>
  onSelect: (id: string) => void
  onSelectAll: () => void
  onDetail: (id: string) => void
  onStart: (id: string) => void
  onComplete: (id: string) => void
  onCancel: (id: string) => void
  filters: ProductionFilters
  onFiltersChange: (filters: ProductionFilters) => void
}

type SortKey = 'product_name' | 'status' | 'event_date' | 'created_at'

export function ProductionTable({
  orders,
  selectedIds,
  onSelect,
  onSelectAll,
  onDetail,
  onStart,
  onComplete,
  onCancel,
  filters,
  onFiltersChange,
}: ProductionTableProps) {
  const allSelected = orders.length > 0 && orders.every(o => selectedIds.has(o.id))

  const handleSort = (key: SortKey) => {
    const currentSort = filters.sortBy
    const currentDir = filters.sortDir || 'desc'
    if (currentSort === key) {
      onFiltersChange({ ...filters, sortDir: currentDir === 'asc' ? 'desc' : 'asc' })
    } else {
      onFiltersChange({ ...filters, sortBy: key, sortDir: 'asc' })
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    const active = filters.sortBy === column
    return (
      <svg className={cn('w-3 h-3 ml-1 inline-block', active ? 'text-primary' : 'text-dark-light/50')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d={active && filters.sortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
        />
      </svg>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 border-b border-border">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
                />
              </th>
              <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => handleSort('product_name')}>
                <span className="font-semibold text-dark-light text-xs uppercase tracking-wider">
                  Producto <SortIcon column="product_name" />
                </span>
              </th>
              <th className="px-4 py-3 text-left hidden md:table-cell">
                <span className="font-semibold text-dark-light text-xs uppercase tracking-wider">SKU</span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="font-semibold text-dark-light text-xs uppercase tracking-wider">Tipo</span>
              </th>
              <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => handleSort('status')}>
                <span className="font-semibold text-dark-light text-xs uppercase tracking-wider">
                  Estado <SortIcon column="status" />
                </span>
              </th>
              <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => handleSort('event_date')}>
                <span className="font-semibold text-dark-light text-xs uppercase tracking-wider">
                  Evento <SortIcon column="event_date" />
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="font-semibold text-dark-light text-xs uppercase tracking-wider">Pedido</span>
              </th>
              <th className="px-4 py-3 text-left hidden lg:table-cell cursor-pointer select-none" onClick={() => handleSort('created_at')}>
                <span className="font-semibold text-dark-light text-xs uppercase tracking-wider">
                  Creado <SortIcon column="created_at" />
                </span>
              </th>
              <th className="px-4 py-3 text-right">
                <span className="font-semibold text-dark-light text-xs uppercase tracking-wider">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-dark-light">
                  No se encontraron ordenes de produccion
                </td>
              </tr>
            ) : (
              orders.map(order => {
                const overdue = isOverdue(order)
                return (
                  <tr
                    key={order.id}
                    className={cn(
                      'border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer',
                      overdue && 'bg-red-50/50',
                      selectedIds.has(order.id) && 'bg-primary/5'
                    )}
                    onClick={() => onDetail(order.id)}
                  >
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => onSelect(order.id)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-dark truncate max-w-[200px]">{order.product_name}</p>
                        {order.quantity > 1 && (
                          <p className="text-xs text-dark-light">x{order.quantity}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-mono bg-gray-100 text-dark-light px-1.5 py-0.5 rounded">
                        {order.sku}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded font-medium', PRODUCT_TYPE_COLORS[order.product_type])}>
                        {PRODUCT_TYPE_LABELS[order.product_type] || order.product_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium', STATUS_COLORS[order.status])}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {order.order?.event_date ? (
                        <span className={cn('text-xs', overdue && 'text-red-600 font-semibold')}>
                          {new Date(order.order.event_date + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                        </span>
                      ) : (
                        <span className="text-xs text-dark-light">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {order.order?.order_number ? (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                          {order.order.order_number}
                        </span>
                      ) : (
                        <span className="text-xs text-dark-light">Stock</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-dark-light">
                        {new Date(order.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => onStart(order.id)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                          >
                            Iniciar
                          </button>
                        )}
                        {order.status === 'in_progress' && (
                          <button
                            onClick={() => onComplete(order.id)}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                          >
                            Completar
                          </button>
                        )}
                        {order.status !== 'completed' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => onCancel(order.id)}
                            className="px-2 py-1 text-xs text-red-600 rounded hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
