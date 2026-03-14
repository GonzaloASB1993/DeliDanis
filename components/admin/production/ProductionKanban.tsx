'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { ProductionKanbanCard } from './ProductionKanbanCard'
import type { ProductionOrder } from '@/lib/supabase/production-queries'

interface ProductionKanbanProps {
  orders: ProductionOrder[]
  selectedIds: Set<string>
  onSelect: (id: string) => void
  onDetail: (id: string) => void
  onStart: (id: string) => void
  onComplete: (id: string) => void
  onCancel: (id: string) => void
  onBatchStartAll?: () => void
}

const COLUMNS = [
  { key: 'pending', title: 'Pendientes', color: 'yellow' as const },
  { key: 'in_progress', title: 'En Proceso', color: 'blue' as const },
  { key: 'completed', title: 'Completados', color: 'green' as const },
]

const headerColors = {
  yellow: 'border-yellow-400 bg-yellow-50 text-yellow-800',
  blue: 'border-blue-400 bg-blue-50 text-blue-800',
  green: 'border-green-400 bg-green-50 text-green-800',
}

export function ProductionKanban({
  orders,
  selectedIds,
  onSelect,
  onDetail,
  onStart,
  onComplete,
  onCancel,
  onBatchStartAll,
}: ProductionKanbanProps) {
  const [mobileTab, setMobileTab] = useState<string>('pending')

  const grouped = {
    pending: orders.filter(o => o.status === 'pending'),
    in_progress: orders.filter(o => o.status === 'in_progress'),
    completed: orders.filter(o => o.status === 'completed').slice(0, 20),
  }

  const getActionProps = (status: string) => {
    if (status === 'pending') return { actionLabel: 'Iniciar', actionColor: 'bg-blue-600 hover:bg-blue-700' }
    if (status === 'in_progress') return { actionLabel: 'Completar', actionColor: 'bg-green-600 hover:bg-green-700' }
    return {}
  }

  const getOnAction = (status: string, id: string) => {
    if (status === 'pending') return () => onStart(id)
    if (status === 'in_progress') return () => onComplete(id)
    return undefined
  }

  return (
    <>
      {/* Mobile Tabs */}
      <div className="flex lg:hidden border-b border-border mb-4">
        {COLUMNS.map(col => (
          <button
            key={col.key}
            onClick={() => setMobileTab(col.key)}
            className={cn(
              'flex-1 py-2.5 text-sm font-medium text-center transition-colors relative',
              mobileTab === col.key
                ? 'text-primary'
                : 'text-dark-light hover:text-dark'
            )}
          >
            {col.title}
            <span className="ml-1.5 text-xs font-mono bg-secondary px-1.5 py-0.5 rounded-full">
              {grouped[col.key as keyof typeof grouped].length}
            </span>
            {mobileTab === col.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Desktop: 3 columns, Mobile: single column based on tab */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {COLUMNS.map(col => {
          const colOrders = grouped[col.key as keyof typeof grouped]
          const actionProps = getActionProps(col.key)
          const showOnMobile = mobileTab === col.key

          return (
            <div
              key={col.key}
              className={cn(
                'bg-white rounded-xl border border-border overflow-hidden',
                !showOnMobile && 'hidden lg:block'
              )}
            >
              {/* Column Header */}
              <div className={cn('px-4 py-3 border-b-2 flex items-center justify-between', headerColors[col.color])}>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{col.title}</h3>
                  <span className="text-xs font-mono bg-white/60 px-2 py-0.5 rounded-full">
                    {colOrders.length}
                  </span>
                </div>
                {col.key === 'pending' && colOrders.length > 1 && onBatchStartAll && (
                  <button
                    onClick={onBatchStartAll}
                    className="text-[10px] font-medium text-yellow-700 hover:text-yellow-900 transition-colors"
                  >
                    Iniciar Todos
                  </button>
                )}
              </div>

              {/* Column Body */}
              <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
                {colOrders.length === 0 ? (
                  <p className="text-center text-dark-light text-sm py-6">Sin elementos</p>
                ) : (
                  colOrders.map(order => (
                    <ProductionKanbanCard
                      key={order.id}
                      order={order}
                      selected={selectedIds.has(order.id)}
                      onSelect={onSelect}
                      onDetail={() => onDetail(order.id)}
                      onAction={getOnAction(order.status, order.id)}
                      onCancel={order.status !== 'completed' ? () => onCancel(order.id) : undefined}
                      {...actionProps}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
