'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/admin/Header'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import {
  getCapacityForMonth,
  upsertCapacity,
  blockDate,
  unblockDate,
  bulkBlockDates,
  type DailyCapacity,
} from '@/lib/supabase/capacity-queries'
import { supabase } from '@/lib/supabase/client'

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DEFAULT_MAX = 5

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface DayInfo {
  dateStr: string
  day: number
  capacity: DailyCapacity | null
  liveOrderCount: number
  isCurrentMonth: boolean
  isPast: boolean
}

interface EditModalState {
  open: boolean
  dateStr: string
  maxOrders: number
  currentOrders: number
  isBlocked: boolean
  blockReason: string
  saving: boolean
}

interface BulkBlockState {
  open: boolean
  startDate: string
  endDate: string
  reason: string
  saving: boolean
}

function getStatusColor(capacity: DailyCapacity | null, liveCount: number, defaultMax: number) {
  if (!capacity && liveCount === 0) return 'border-border bg-white hover:bg-secondary'
  const isBlocked = capacity?.is_blocked ?? false
  if (isBlocked) return 'border-dark/30 bg-dark/10 hover:bg-dark/15'
  const max = capacity?.max_orders ?? defaultMax
  const ratio = liveCount / max
  if (ratio >= 1) return 'border-red-300 bg-red-50 hover:bg-red-100'
  if (ratio >= 0.7) return 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
  return 'border-green-300 bg-green-50 hover:bg-green-100'
}

function StatusDot({ capacity, liveCount, defaultMax }: { capacity: DailyCapacity | null; liveCount: number; defaultMax: number }) {
  const isBlocked = capacity?.is_blocked ?? false
  if (isBlocked) return <span className="inline-block w-2 h-2 rounded-full bg-dark/40" />
  const max = capacity?.max_orders ?? defaultMax
  const ratio = liveCount / max
  if (ratio >= 1) return <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
  if (ratio >= 0.7) return <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" />
  return <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
}

export default function CapacidadPage() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1) // 1-indexed
  const [capacityMap, setCapacityMap] = useState<Record<string, DailyCapacity>>({})
  const [orderCountMap, setOrderCountMap] = useState<Record<string, number>>({})
  const [defaultMax, setDefaultMax] = useState(DEFAULT_MAX)
  const [defaultMaxInput, setDefaultMaxInput] = useState(String(DEFAULT_MAX))
  const [loading, setLoading] = useState(true)

  const [editModal, setEditModal] = useState<EditModalState>({
    open: false, dateStr: '', maxOrders: DEFAULT_MAX, currentOrders: 0,
    isBlocked: false, blockReason: '', saving: false,
  })

  const [bulkBlock, setBulkBlock] = useState<BulkBlockState>({
    open: false, startDate: '', endDate: '', reason: '', saving: false,
  })

  const todayStr = toDateString(today)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const capacityRows = await getCapacityForMonth(currentYear, currentMonth)
      const map: Record<string, DailyCapacity> = {}
      capacityRows.forEach(row => { map[row.date] = row })
      setCapacityMap(map)

      // Fetch live order counts
      const firstDay = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
      const lastDayDate = new Date(currentYear, currentMonth, 0)
      const lastDay = toDateString(lastDayDate)

      const { data: orders } = await supabase
        .from('orders')
        .select('delivery_date')
        .gte('delivery_date', firstDay)
        .lte('delivery_date', lastDay)
        .not('status', 'in', '("cancelled","completed","delivered")')

      const counts: Record<string, number> = {}
      orders?.forEach(o => {
        const d = o.delivery_date
        counts[d] = (counts[d] ?? 0) + 1
      })
      setOrderCountMap(counts)
    } finally {
      setLoading(false)
    }
  }, [currentYear, currentMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Build calendar grid
  const calendarDays = (() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1)
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0)
    const startWeekday = firstDayOfMonth.getDay() // 0=Sun
    const daysInMonth = lastDayOfMonth.getDate()

    const days: DayInfo[] = []

    // Padding from previous month
    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(currentYear, currentMonth - 1, -startWeekday + i + 1)
      const dateStr = toDateString(d)
      days.push({
        dateStr, day: d.getDate(), capacity: null,
        liveOrderCount: 0, isCurrentMonth: false,
        isPast: d < today,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth - 1, d)
      const dateStr = toDateString(date)
      days.push({
        dateStr, day: d,
        capacity: capacityMap[dateStr] ?? null,
        liveOrderCount: orderCountMap[dateStr] ?? 0,
        isCurrentMonth: true,
        isPast: dateStr < todayStr,
      })
    }

    // Padding to complete last row
    const remaining = 7 - (days.length % 7)
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(currentYear, currentMonth, i)
        const dateStr = toDateString(d)
        days.push({
          dateStr, day: d.getDate(), capacity: null,
          liveOrderCount: 0, isCurrentMonth: false,
          isPast: false,
        })
      }
    }

    return days
  })()

  function openEditModal(day: DayInfo) {
    if (!day.isCurrentMonth) return
    setEditModal({
      open: true,
      dateStr: day.dateStr,
      maxOrders: day.capacity?.max_orders ?? defaultMax,
      currentOrders: day.liveOrderCount,
      isBlocked: day.capacity?.is_blocked ?? false,
      blockReason: day.capacity?.block_reason ?? '',
      saving: false,
    })
  }

  async function handleSaveEdit() {
    setEditModal(prev => ({ ...prev, saving: true }))
    await upsertCapacity(editModal.dateStr, {
      max_orders: editModal.maxOrders,
      is_blocked: editModal.isBlocked,
      block_reason: editModal.isBlocked ? (editModal.blockReason || null) : null,
    })
    setEditModal(prev => ({ ...prev, open: false, saving: false }))
    await loadData()
  }

  async function handleBulkBlock() {
    if (!bulkBlock.startDate || !bulkBlock.endDate) return
    setBulkBlock(prev => ({ ...prev, saving: true }))

    const dates: string[] = []
    const current = new Date(bulkBlock.startDate + 'T12:00:00')
    const end = new Date(bulkBlock.endDate + 'T12:00:00')
    while (current <= end) {
      dates.push(toDateString(current))
      current.setDate(current.getDate() + 1)
    }

    await bulkBlockDates(dates, bulkBlock.reason || undefined)
    setBulkBlock({ open: false, startDate: '', endDate: '', reason: '', saving: false })
    await loadData()
  }

  function prevMonth() {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }

  function nextMonth() {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  // Summary stats
  const currentMonthDays = calendarDays.filter(d => d.isCurrentMonth)
  const blockedCount = currentMonthDays.filter(d => d.capacity?.is_blocked).length
  const fullCount = currentMonthDays.filter(d => {
    if (d.capacity?.is_blocked) return false
    const max = d.capacity?.max_orders ?? defaultMax
    return d.liveOrderCount >= max
  }).length
  const availableCount = currentMonthDays.length - blockedCount - fullCount

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header
        title="Capacidad Diaria"
        subtitle="Gestiona la disponibilidad y límites de pedidos por fecha"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div>
              <p className="text-xs text-dark-light font-medium uppercase tracking-wide">Disponibles</p>
              <p className="text-2xl font-bold text-dark">{availableCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
            </div>
            <div>
              <p className="text-xs text-dark-light font-medium uppercase tracking-wide">Completos</p>
              <p className="text-2xl font-bold text-dark">{fullCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-dark/10 flex items-center justify-center">
              <span className="inline-block w-3 h-3 rounded-full bg-dark/40" />
            </div>
            <div>
              <p className="text-xs text-dark-light font-medium uppercase tracking-wide">Bloqueados</p>
              <p className="text-2xl font-bold text-dark">{blockedCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-dark-light font-medium uppercase tracking-wide">Max default</p>
              <p className="text-2xl font-bold text-dark">{defaultMax}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="xl:col-span-3 bg-white rounded-xl border border-border p-6">
            {/* Month navigator */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-secondary text-dark-light hover:text-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="font-display text-xl font-semibold text-dark">
                {MONTHS[currentMonth - 1]} {currentYear}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-secondary text-dark-light hover:text-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-dark-light py-2 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            {loading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="min-h-[80px] rounded-lg bg-secondary animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const max = day.capacity?.max_orders ?? defaultMax
                  const isToday = day.dateStr === todayStr

                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => openEditModal(day)}
                      disabled={!day.isCurrentMonth}
                      className={cn(
                        'min-h-[80px] rounded-lg border-2 p-2 flex flex-col transition-all text-left',
                        day.isCurrentMonth
                          ? getStatusColor(day.capacity, day.liveOrderCount, defaultMax)
                          : 'border-transparent bg-transparent opacity-30 cursor-default',
                        isToday && 'ring-2 ring-primary ring-offset-1',
                        day.isPast && day.isCurrentMonth && 'opacity-60'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={cn(
                          'text-sm font-semibold',
                          isToday ? 'text-primary' : 'text-dark'
                        )}>
                          {day.day}
                        </span>
                        {day.isCurrentMonth && (
                          <StatusDot
                            capacity={day.capacity}
                            liveCount={day.liveOrderCount}
                            defaultMax={defaultMax}
                          />
                        )}
                      </div>

                      {day.isCurrentMonth && (
                        <div className="mt-auto">
                          {day.capacity?.is_blocked ? (
                            <span className="text-[10px] font-medium text-dark-light leading-tight">
                              Bloqueado
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-dark-light leading-tight">
                              {day.liveOrderCount}/{max}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-dark-light">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                Disponible
              </div>
              <div className="flex items-center gap-1.5 text-xs text-dark-light">
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-500" />
                Casi lleno
              </div>
              <div className="flex items-center gap-1.5 text-xs text-dark-light">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                Completo
              </div>
              <div className="flex items-center gap-1.5 text-xs text-dark-light">
                <span className="inline-block w-3 h-3 rounded-full bg-dark/40" />
                Bloqueado
              </div>
            </div>
          </div>

          {/* Side panel: Quick actions */}
          <div className="space-y-4">
            {/* Default capacity */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-display text-base font-semibold text-dark mb-1">
                Capacidad por defecto
              </h3>
              <p className="text-xs text-dark-light mb-4">
                Pedidos maximos para dias sin configuracion especifica
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={defaultMaxInput}
                  onChange={e => setDefaultMaxInput(e.target.value)}
                  className="w-20 border border-border rounded-lg px-3 py-2 text-center text-dark font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const val = parseInt(defaultMaxInput)
                    if (!isNaN(val) && val > 0) setDefaultMax(val)
                  }}
                >
                  Aplicar
                </Button>
              </div>
              <p className="text-xs text-dark-light mt-2">
                Este valor es local y no se guarda en la base de datos. Para guardar, edita cada fecha individualmente.
              </p>
            </div>

            {/* Bulk block */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-display text-base font-semibold text-dark mb-1">
                Bloqueo masivo
              </h3>
              <p className="text-xs text-dark-light mb-4">
                Bloquea un rango de fechas a la vez
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => setBulkBlock(prev => ({ ...prev, open: true }))}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Bloquear rango de fechas
              </Button>
            </div>

            {/* Instructions */}
            <div className="bg-secondary rounded-xl border border-border p-5">
              <h3 className="font-display text-sm font-semibold text-dark mb-2">Como usar</h3>
              <ul className="space-y-2 text-xs text-dark-light">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  Haz clic en cualquier fecha del mes actual para editarla
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  Ajusta el maximo de pedidos o bloquea la fecha por completo
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  Los contadores muestran pedidos activos / maximo permitido
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  Usa el bloqueo masivo para vacaciones o dias festivos
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Edit date modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditModal(prev => ({ ...prev, open: false }))} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-lg font-bold text-dark">Editar capacidad</h2>
                <p className="text-sm text-dark-light mt-0.5">
                  {new Date(editModal.dateStr + 'T12:00:00').toLocaleDateString('es-CO', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={() => setEditModal(prev => ({ ...prev, open: false }))}
                className="p-2 rounded-lg hover:bg-secondary text-dark-light transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              {/* Max orders */}
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Pedidos maximos
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={editModal.maxOrders}
                  onChange={e => setEditModal(prev => ({ ...prev, maxOrders: parseInt(e.target.value) || 1 }))}
                  disabled={editModal.isBlocked}
                  className="w-full border border-border rounded-lg px-3 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-secondary disabled:text-dark-light"
                />
              </div>

              {/* Current orders (read-only) */}
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Pedidos actuales
                </label>
                <div className="border border-border rounded-lg px-3 py-2 bg-secondary text-dark-light text-sm">
                  {editModal.currentOrders} pedido{editModal.currentOrders !== 1 ? 's' : ''} activo{editModal.currentOrders !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Block toggle */}
              <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-dark">Bloquear fecha</p>
                  <p className="text-xs text-dark-light mt-0.5">No se podran tomar pedidos</p>
                </div>
                <button
                  onClick={() => setEditModal(prev => ({ ...prev, isBlocked: !prev.isBlocked }))}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                    editModal.isBlocked ? 'bg-primary' : 'bg-border'
                  )}
                >
                  <span className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                    editModal.isBlocked ? 'translate-x-6' : 'translate-x-1'
                  )} />
                </button>
              </div>

              {/* Block reason */}
              {editModal.isBlocked && (
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">
                    Razon del bloqueo <span className="text-dark-light font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Dia festivo, vacaciones..."
                    value={editModal.blockReason}
                    onChange={e => setEditModal(prev => ({ ...prev, blockReason: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setEditModal(prev => ({ ...prev, open: false }))}
                disabled={editModal.saving}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleSaveEdit}
                isLoading={editModal.saving}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk block modal */}
      {bulkBlock.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setBulkBlock(prev => ({ ...prev, open: false }))} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-lg font-bold text-dark">Bloqueo masivo</h2>
                <p className="text-sm text-dark-light mt-0.5">Bloquea multiples fechas a la vez</p>
              </div>
              <button
                onClick={() => setBulkBlock(prev => ({ ...prev, open: false }))}
                className="p-2 rounded-lg hover:bg-secondary text-dark-light transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">Fecha inicial</label>
                <input
                  type="date"
                  value={bulkBlock.startDate}
                  onChange={e => setBulkBlock(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">Fecha final</label>
                <input
                  type="date"
                  value={bulkBlock.endDate}
                  min={bulkBlock.startDate}
                  onChange={e => setBulkBlock(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Razon <span className="text-dark-light font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Semana de vacaciones, cierre temporal..."
                  value={bulkBlock.reason}
                  onChange={e => setBulkBlock(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setBulkBlock(prev => ({ ...prev, open: false }))}
                disabled={bulkBlock.saving}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleBulkBlock}
                isLoading={bulkBlock.saving}
                disabled={!bulkBlock.startDate || !bulkBlock.endDate}
              >
                Bloquear fechas
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
