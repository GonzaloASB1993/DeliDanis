'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils/cn'
import type { ProductionOrder } from '@/lib/supabase/production-queries'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300',
  in_progress: 'bg-blue-200 text-blue-800 hover:bg-blue-300',
  completed: 'bg-green-200 text-green-800 hover:bg-green-300',
  cancelled: 'bg-gray-200 text-gray-600',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En Proceso',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']

interface ProductionTimelineProps {
  orders: ProductionOrder[]
  onDetail: (id: string) => void
}

export function ProductionTimeline({ orders, onDetail }: ProductionTimelineProps) {
  const [weekOffset, setWeekOffset] = useState(0)

  const today = useMemo(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }, [])

  // Calculate week start (Monday)
  const weekStart = useMemo(() => {
    const d = new Date(today)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day // Monday = 1
    d.setDate(d.getDate() + diff + weekOffset * 7)
    return d
  }, [today, weekOffset])

  // Generate 7 days
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  // Mobile: show 3 days centered on today
  const mobileDays = useMemo(() => {
    if (weekOffset === 0) {
      const todayIdx = days.findIndex(d => d.toDateString() === today.toDateString())
      if (todayIdx >= 0) {
        const start = Math.max(0, Math.min(todayIdx - 1, days.length - 3))
        return days.slice(start, start + 3)
      }
    }
    return days.slice(0, 3)
  }, [days, today, weekOffset])

  // Group orders by event_date
  const ordersByDate = useMemo(() => {
    const map: Record<string, ProductionOrder[]> = {}
    for (const order of orders) {
      const eventDate = order.order?.event_date
      if (!eventDate) continue
      if (!map[eventDate]) map[eventDate] = []
      map[eventDate].push(order)
    }
    return map
  }, [orders])

  const formatDateKey = (d: Date) => d.toISOString().split('T')[0]
  const isToday = (d: Date) => d.toDateString() === today.toDateString()

  const getCapacityColor = (count: number) => {
    if (count === 0) return 'text-dark-light'
    if (count <= 2) return 'text-green-600'
    if (count <= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  const weekLabel = useMemo(() => {
    const start = days[0]
    const end = days[6]
    const startStr = start.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
    const endStr = end.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
    return `${startStr} - ${endStr}`
  }, [days])

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          className="p-2 rounded-lg hover:bg-secondary text-dark-light hover:text-dark transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-dark">{weekLabel}</p>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-primary hover:underline mt-0.5"
            >
              Ir a hoy
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset(w => w + 1)}
          className="p-2 rounded-lg hover:bg-secondary text-dark-light hover:text-dark transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Desktop Grid (7 days) */}
      <div className="hidden md:grid grid-cols-5 lg:grid-cols-7 gap-3">
        {days.map((day, i) => {
          const dateKey = formatDateKey(day)
          const dayOrders = ordersByDate[dateKey] || []
          const isTodayDate = isToday(day)
          // On tablet, hide weekend (indexes 5, 6)
          const isWeekend = i >= 5

          return (
            <div
              key={dateKey}
              className={cn(
                'bg-white rounded-xl border min-h-[160px] overflow-hidden',
                isTodayDate ? 'ring-2 ring-primary border-primary' : 'border-border',
                isWeekend && 'hidden lg:block'
              )}
            >
              {/* Day Header */}
              <div className={cn(
                'px-3 py-2 border-b text-center',
                isTodayDate ? 'bg-primary/10 border-primary/20' : 'bg-secondary/50 border-border/50'
              )}>
                <p className="text-[10px] uppercase font-semibold text-dark-light">{DAY_NAMES[day.getDay()]}</p>
                <p className={cn('text-lg font-bold', isTodayDate ? 'text-primary' : 'text-dark')}>
                  {day.getDate()}
                </p>
                <p className={cn('text-[10px] font-medium', getCapacityColor(dayOrders.length))}>
                  {dayOrders.length} orden{dayOrders.length !== 1 ? 'es' : ''}
                </p>
              </div>

              {/* Orders */}
              <div className="p-1.5 space-y-1 max-h-[200px] overflow-y-auto">
                {dayOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => onDetail(order.id)}
                    className={cn(
                      'w-full text-left px-2 py-1 rounded text-[10px] font-medium truncate transition-colors',
                      STATUS_COLORS[order.status]
                    )}
                    title={`${order.product_name} - ${STATUS_LABELS[order.status]}`}
                  >
                    {order.product_name}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile Grid (3 days) */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        {mobileDays.map(day => {
          const dateKey = formatDateKey(day)
          const dayOrders = ordersByDate[dateKey] || []
          const isTodayDate = isToday(day)

          return (
            <div
              key={dateKey}
              className={cn(
                'bg-white rounded-xl border min-h-[140px] overflow-hidden',
                isTodayDate ? 'ring-2 ring-primary border-primary' : 'border-border'
              )}
            >
              <div className={cn(
                'px-2 py-1.5 border-b text-center',
                isTodayDate ? 'bg-primary/10 border-primary/20' : 'bg-secondary/50 border-border/50'
              )}>
                <p className="text-[10px] uppercase font-semibold text-dark-light">{DAY_NAMES[day.getDay()]}</p>
                <p className={cn('text-base font-bold', isTodayDate ? 'text-primary' : 'text-dark')}>
                  {day.getDate()}
                </p>
              </div>
              <div className="p-1 space-y-0.5 max-h-[120px] overflow-y-auto">
                {dayOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => onDetail(order.id)}
                    className={cn(
                      'w-full text-left px-1.5 py-0.5 rounded text-[9px] font-medium truncate transition-colors',
                      STATUS_COLORS[order.status]
                    )}
                  >
                    {order.product_name}
                  </button>
                ))}
                {dayOrders.length === 0 && (
                  <p className="text-[9px] text-dark-light text-center py-2">-</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 justify-center">
        {Object.entries(STATUS_LABELS).filter(([k]) => k !== 'cancelled').map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={cn('w-3 h-3 rounded', STATUS_COLORS[key]?.split(' ')[0])} />
            <span className="text-[10px] text-dark-light">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
