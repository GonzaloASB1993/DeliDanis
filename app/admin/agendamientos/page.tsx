'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Header } from '@/components/admin/Header'
import { Button } from '@/components/ui/Button'
import { OrderDetailModal } from '@/components/admin/OrderDetailModal'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { getOrders, getOrderStats } from '@/lib/supabase/orders-queries'
import { getProductionCostsByOrderIds } from '@/lib/supabase/production-queries'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'in_production', label: 'En Producción' },
  { value: 'ready', label: 'Listos' },
  { value: 'delivered', label: 'Entregados' },
  { value: 'cancelled', label: 'Cancelados' },
]

const statusColors: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-700 border-orange-200',
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  in_production: 'bg-blue-100 text-blue-700 border-blue-200',
  ready: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-gray-100 text-gray-700 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  in_production: 'En Producción',
  ready: 'Listo',
  delivered: 'Entregado',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

interface Order {
  id: string
  order_number: string
  event_date: string
  event_time: string | null
  status: string
  payment_status: string
  total: number
  deposit_amount: number
  deposit_paid: boolean
  delivery_type: string
  customer: {
    id: string
    first_name: string
    last_name: string
    phone: string
    email: string
  } | null
  items: {
    id: string
    service_type: string
    product_name: string | null
    quantity: number
    portions: number | null
    total_price: number
  }[]
}

export default function AgendamientosPage() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    ready: 0,
    delivered: 0,
    total: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalPending: 0,
  })

  // Costs
  const [orderCosts, setOrderCosts] = useState<Record<string, number>>({})

  // Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Cargar datos
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [ordersData, statsData] = await Promise.all([
        getOrders({
          month: selectedMonth,
          year: selectedYear,
          status: statusFilter,
          search: searchQuery,
        }),
        getOrderStats(selectedMonth, selectedYear),
      ])

      setOrders(ordersData as Order[])
      setStats(statsData)

      // Load production costs
      const ids = (ordersData as Order[]).map(o => o.id)
      if (ids.length > 0) {
        try {
          const costs = await getProductionCostsByOrderIds(ids)
          setOrderCosts(costs)
        } catch {
          setOrderCosts({})
        }
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, selectedYear, statusFilter, searchQuery])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openOrderDetail = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsModalOpen(true)
  }

  const getPaymentBadge = (order: Order) => {
    if (order.payment_status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Pagado
        </span>
      )
    }
    if (order.deposit_paid && order.deposit_amount > 0) {
      const saldo = order.total - order.deposit_amount
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
          Abonado (Saldo: {formatCurrency(saldo)})
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        Sin pago
      </span>
    )
  }

  const getServicesSummary = (items: Order['items']) => {
    if (!items || items.length === 0) return '-'
    return items.map(item => item.product_name || item.service_type).join(', ')
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Gestión de Agendamientos"
        actions={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={loadData} className="gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </Button>
            <Link href="/admin/agendamientos/nuevo">
              <Button className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Agendamiento
              </Button>
            </Link>
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-dark-light hover:bg-secondary'
                )}
                title="Vista lista"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'calendar' ? 'bg-primary text-white' : 'bg-white text-dark-light hover:bg-secondary'
                )}
                title="Vista calendario"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-orange-400 rounded-xl p-5 text-white">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-center">{stats.pending}</p>
            <p className="text-center text-white/80">Pendientes</p>
          </div>
          <div className="bg-green-500 rounded-xl p-5 text-white">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-center">{stats.confirmed}</p>
            <p className="text-center text-white/80">Confirmados</p>
          </div>
          <div className="bg-cyan-500 rounded-xl p-5 text-white">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-center">{stats.ready + stats.delivered}</p>
            <p className="text-center text-white/80">Listos / Entregados</p>
          </div>
          <div className="bg-primary rounded-xl p-5 text-white">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-center">{stats.total}</p>
            <p className="text-center text-white/80">Total del Mes</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-dark-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por cliente, teléfono, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Mes/Año */}
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2.5 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2.5 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Filtro por estado */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-sm text-dark-light whitespace-nowrap">Estado:</span>
              <div className="flex gap-1">
                {STATUS_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap',
                      statusFilter === option.value
                        ? 'bg-dark text-white'
                        : 'bg-secondary text-dark hover:bg-dark/10'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm text-dark-light mt-3">
            Mostrando {orders.length} de {stats.total} agendamientos
          </p>
        </div>

        {/* Tabla de pedidos */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-dark-light">Cargando...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-dark-light">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No hay agendamientos para este período</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary text-sm text-dark-light border-b border-border">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium">Cliente</th>
                      <th className="text-left px-5 py-3 font-medium">Servicio</th>
                      <th className="text-left px-5 py-3 font-medium">Fecha</th>
                      <th className="text-left px-5 py-3 font-medium">Estado</th>
                      <th className="text-left px-5 py-3 font-medium">Pago</th>
                      <th className="text-right px-5 py-3 font-medium">Total</th>
                      <th className="text-right px-5 py-3 font-medium">Costo</th>
                      <th className="text-right px-5 py-3 font-medium">Margen</th>
                      <th className="text-center px-5 py-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map(order => (
                      <tr
                        key={order.id}
                        className="hover:bg-secondary/50 transition-colors cursor-pointer"
                        onClick={() => openOrderDetail(order.id)}
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-dark">
                            {order.customer?.first_name} {order.customer?.last_name}
                          </p>
                          <p className="text-sm text-dark-light">{order.customer?.phone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-dark text-sm max-w-[200px] truncate">
                            {getServicesSummary(order.items)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-dark">
                            {(() => { const [y,m,d] = order.event_date.split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }); })()}
                          </p>
                          <p className="text-sm text-dark-light">{order.event_time || '-'}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            'inline-flex px-2.5 py-1 rounded-full text-xs font-medium border',
                            statusColors[order.status]
                          )}>
                            {statusLabels[order.status]}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {getPaymentBadge(order)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="font-semibold text-dark">{formatCurrency(order.total)}</p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {orderCosts[order.id] != null && orderCosts[order.id] > 0 ? (
                            <p className="text-sm text-dark-light">{formatCurrency(orderCosts[order.id])}</p>
                          ) : (
                            <p className="text-sm text-dark-light/50">-</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {orderCosts[order.id] != null && orderCosts[order.id] > 0 ? (
                            (() => {
                              const cost = orderCosts[order.id]
                              const margin = order.total - cost
                              const marginPct = order.total > 0 ? (margin / order.total) * 100 : 0
                              return (
                                <div>
                                  <p className={cn(
                                    'text-sm font-medium',
                                    margin >= 0 ? 'text-green-600' : 'text-red-600'
                                  )}>
                                    {formatCurrency(margin)}
                                  </p>
                                  <p className={cn(
                                    'text-xs',
                                    margin >= 0 ? 'text-green-500' : 'text-red-500'
                                  )}>
                                    {marginPct.toFixed(0)}%
                                  </p>
                                </div>
                              )
                            })()
                          ) : (
                            <p className="text-sm text-dark-light/50">-</p>
                          )}
                        </td>
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openOrderDetail(order.id)}
                              className="p-2 text-dark-light hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Ver detalle"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <a
                              href={`https://wa.me/${order.customer?.phone?.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-dark-light hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Enviar WhatsApp"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                              </svg>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Vista calendario */}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-xl border border-border p-6">
            <CalendarView
              orders={orders}
              month={selectedMonth}
              year={selectedYear}
              onOrderClick={openOrderDetail}
            />
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      <OrderDetailModal
        orderId={selectedOrderId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedOrderId(null)
        }}
        onUpdate={loadData}
      />
    </div>
  )
}

// Componente de vista de calendario
function CalendarView({
  orders,
  month,
  year,
  onOrderClick
}: {
  orders: Order[]
  month: number
  year: number
  onOrderClick: (id: string) => void
}) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()
  const startDay = firstDay.getDay() // 0 = domingo

  const days = []

  // Días vacíos al inicio
  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }

  // Días del mes
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const getOrdersForDay = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return orders.filter(order => order.event_date === dateStr)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return today.getDate() === day &&
           today.getMonth() === month - 1 &&
           today.getFullYear() === year
  }

  return (
    <div className="overflow-x-auto">
    <div className="min-w-[700px]">
      {/* Header días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-dark-light py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div
            key={index}
            className={cn(
              'min-h-[100px] p-1 border border-border rounded-lg',
              day ? 'bg-white' : 'bg-secondary/30',
              isToday(day!) && 'ring-2 ring-primary'
            )}
          >
            {day && (
              <>
                <div className={cn(
                  'text-sm font-medium mb-1',
                  isToday(day) ? 'text-primary' : 'text-dark'
                )}>
                  {day}
                </div>
                <div className="space-y-1">
                  {getOrdersForDay(day).slice(0, 3).map(order => (
                    <button
                      key={order.id}
                      onClick={() => onOrderClick(order.id)}
                      className={cn(
                        'w-full text-left px-1.5 py-0.5 rounded text-xs truncate',
                        statusColors[order.status]
                      )}
                    >
                      {order.customer?.first_name}
                    </button>
                  ))}
                  {getOrdersForDay(day).length > 3 && (
                    <p className="text-xs text-dark-light text-center">
                      +{getOrdersForDay(day).length - 3} más
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
    </div>
  )
}
