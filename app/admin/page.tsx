'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Header } from '@/components/admin/Header'
import { OrderDetailModal } from '@/components/admin/OrderDetailModal'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import {
  getDashboardMetrics,
  getRecentOrders,
  getMonthlyChartData,
  getServiceDistribution,
  type DashboardMetrics,
  type OrderSummary,
  type ChartData,
} from '@/lib/supabase/dashboard-queries'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const SERVICE_COLORS: Record<string, { bar: string; bg: string; text: string; dot: string }> = {
  'Tortas': { bar: 'bg-rose-400', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-400' },
  'Cocteleria': { bar: 'bg-violet-400', bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400' },
  'Pasteleria': { bar: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  'Otros': { bar: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
}

export default function AdminDashboardPage() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([])
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [serviceDistribution, setServiceDistribution] = useState<Record<string, number> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [metricsData, ordersData, chart, distribution] = await Promise.all([
        getDashboardMetrics(selectedMonth, selectedYear),
        getRecentOrders(5),
        getMonthlyChartData(selectedYear),
        getServiceDistribution(selectedMonth, selectedYear),
      ])
      setMetrics(metricsData)
      setRecentOrders(ordersData)
      setChartData(chart)
      setServiceDistribution(distribution)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleOpenOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedOrderId(null)
  }

  const statusConfig: Record<string, { label: string; bg: string; dot: string }> = {
    pending: { label: 'Pendiente', bg: 'bg-amber-50 text-amber-800', dot: 'bg-amber-400' },
    confirmed: { label: 'Confirmado', bg: 'bg-emerald-50 text-emerald-800', dot: 'bg-emerald-400' },
    in_production: { label: 'En Producción', bg: 'bg-blue-50 text-blue-800', dot: 'bg-blue-400' },
    ready: { label: 'Listo', bg: 'bg-teal-50 text-teal-800', dot: 'bg-teal-400' },
    delivered: { label: 'Entregado', bg: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
    completed: { label: 'Completado', bg: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
    cancelled: { label: 'Cancelado', bg: 'bg-red-50 text-red-700', dot: 'bg-red-400' },
  }

  const paymentConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Sin pago', color: 'text-red-500' },
    partial: { label: 'Abonado', color: 'text-amber-600' },
    paid: { label: 'Pagado', color: 'text-emerald-600' },
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header
        title="Dashboard"
        subtitle={`${MONTHS[selectedMonth - 1]} ${selectedYear}`}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl p-5 animate-pulse bg-white h-32" />
            ))}
          </div>
        ) : (
          <>
            {/* ─── KPI Cards ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Ingresos */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg shadow-emerald-500/20">
                <div className="relative z-10">
                  <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Ingresos</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1.5 tabular-nums">{formatCurrency(metrics?.ingresosMes || 0)}</p>
                  <p className="text-emerald-200 text-xs mt-1">{MONTHS[selectedMonth - 1]}</p>
                </div>
                <div className="absolute -right-3 -bottom-3 opacity-15">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.94s4.18 1.36 4.18 3.85c0 1.89-1.44 2.98-3.12 3.19z" />
                  </svg>
                </div>
              </div>

              {/* Por cobrar */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-lg shadow-amber-500/20">
                <div className="relative z-10">
                  <p className="text-amber-100 text-xs font-semibold uppercase tracking-wider">Por cobrar</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1.5 tabular-nums">{formatCurrency(metrics?.saldoPorCobrar || 0)}</p>
                  <p className="text-amber-200 text-xs mt-1">Pendiente</p>
                </div>
                <div className="absolute -right-3 -bottom-3 opacity-15">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                  </svg>
                </div>
              </div>

              {/* Próximos eventos */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-white shadow-lg shadow-violet-500/20">
                <div className="relative z-10">
                  <p className="text-violet-200 text-xs font-semibold uppercase tracking-wider">Próximos</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1.5">{metrics?.proximosEventos || 0}</p>
                  <p className="text-violet-200 text-xs mt-1">En 7 días</p>
                </div>
                <div className="absolute -right-3 -bottom-3 opacity-15">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
                  </svg>
                </div>
              </div>

              {/* Total pedidos */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-5 text-white shadow-lg shadow-sky-500/20">
                <div className="relative z-10">
                  <p className="text-sky-200 text-xs font-semibold uppercase tracking-wider">Pedidos</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1.5">{metrics?.totalPedidos || 0}</p>
                  <p className="text-sky-200 text-xs mt-1">{MONTHS[selectedMonth - 1]}</p>
                </div>
                <div className="absolute -right-3 -bottom-3 opacity-15">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* ─── Pipeline + Alertas ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Pipeline de pedidos */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5">
                <h3 className="font-display font-semibold text-dark mb-4">Pipeline de pedidos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Pendientes', value: metrics?.pedidosPendientes || 0, color: 'from-amber-400 to-amber-500', shadow: 'shadow-amber-400/25' },
                    { label: 'Confirmados', value: metrics?.pedidosConfirmados || 0, color: 'from-emerald-400 to-emerald-500', shadow: 'shadow-emerald-400/25' },
                    { label: 'Producción', value: metrics?.productionInProgress || 0, color: 'from-blue-400 to-blue-500', shadow: 'shadow-blue-400/25' },
                    { label: 'Completados', value: metrics?.pedidosCompletados || 0, color: 'from-gray-400 to-gray-500', shadow: 'shadow-gray-400/15' },
                  ].map(item => (
                    <div key={item.label} className={cn('rounded-xl bg-gradient-to-br p-4 text-white shadow-md', item.color, item.shadow)}>
                      <p className="text-3xl font-bold">{item.value}</p>
                      <p className="text-white/80 text-xs font-medium mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alertas / Quick actions */}
              <div className="space-y-4">
                {(metrics?.itemsStockBajo || 0) > 0 && (
                  <Link href="/admin/inventario" className="block">
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-xl">
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-orange-800 text-sm">{metrics?.itemsStockBajo} items stock bajo</p>
                          <p className="text-orange-600 text-xs">Ver inventario →</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                <div className="bg-white rounded-2xl border border-border p-4">
                  <p className="text-xs font-semibold text-dark-light uppercase tracking-wider mb-3">Acciones</p>
                  <div className="space-y-2">
                    <Link
                      href="/admin/agendamientos/nuevo"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors group"
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-dark">Nuevo Agendamiento</span>
                    </Link>
                    <Link
                      href="/admin/catalogo"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors group"
                    >
                      <div className="p-1.5 rounded-lg bg-secondary text-dark-light group-hover:bg-dark group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-dark">Gestionar Catálogo</span>
                    </Link>
                    <Link
                      href="/admin/reportes"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors group"
                    >
                      <div className="p-1.5 rounded-lg bg-secondary text-dark-light group-hover:bg-dark group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-dark">Ver Reportes</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Charts ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Ingresos mensuales — wider */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display font-semibold text-dark">Ingresos {selectedYear}</h3>
                  {chartData && (
                    <span className="text-xs text-dark-light bg-secondary px-2.5 py-1 rounded-full">
                      Total: {formatCurrency(chartData.ingresos.reduce((a, b) => a + b, 0))}
                    </span>
                  )}
                </div>
                {chartData ? (
                  <div className="flex items-end gap-[3px] sm:gap-1.5 h-52">
                    {(() => {
                      const maxValue = Math.max(...chartData.ingresos, 1)
                      return chartData.labels.map((label, index) => {
                        const value = chartData.ingresos[index]
                        const pct = (value / maxValue) * 100
                        const isSelected = index === selectedMonth - 1
                        const isFuture = index > now.getMonth() && selectedYear === now.getFullYear()
                        return (
                          <div key={label} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                            <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-dark text-white text-[11px] px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                              {formatCurrency(value)}
                            </div>
                            <div className="w-full relative" style={{ height: '192px' }}>
                              <div
                                className={cn(
                                  'absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-300',
                                  isFuture
                                    ? 'bg-gray-100'
                                    : isSelected
                                      ? 'bg-gradient-to-t from-primary to-primary-light shadow-sm shadow-primary/30'
                                      : 'bg-primary/20 group-hover:bg-primary/40'
                                )}
                                style={{ height: `${Math.max(pct, 2)}%` }}
                              />
                            </div>
                            <span className={cn(
                              'text-[10px]',
                              isSelected ? 'text-primary font-bold' : 'text-dark-light'
                            )}>
                              {label}
                            </span>
                          </div>
                        )
                      })
                    })()}
                  </div>
                ) : (
                  <div className="h-52 flex items-center justify-center text-dark-light text-sm">
                    Sin datos disponibles
                  </div>
                )}
              </div>

              {/* Distribución por servicio */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5">
                <h3 className="font-display font-semibold text-dark mb-5">
                  Por servicio
                </h3>
                {serviceDistribution ? (() => {
                  const total = Object.values(serviceDistribution).reduce((a, b) => a + b, 0)
                  if (total === 0) {
                    return <p className="text-dark-light text-sm text-center py-8">Sin datos</p>
                  }

                  // Stacked bar
                  const entries = Object.entries(serviceDistribution).filter(([, v]) => v > 0)
                  return (
                    <div className="space-y-5">
                      {/* Visual stacked bar */}
                      <div className="flex rounded-full h-5 overflow-hidden bg-secondary">
                        {entries.map(([name, value]) => {
                          const pct = (value / total) * 100
                          const colors = SERVICE_COLORS[name] || SERVICE_COLORS['Otros']
                          return (
                            <div
                              key={name}
                              className={cn('h-full transition-all first:rounded-l-full last:rounded-r-full', colors.bar)}
                              style={{ width: `${pct}%` }}
                              title={`${name}: ${pct.toFixed(0)}%`}
                            />
                          )
                        })}
                      </div>

                      {/* Legend cards */}
                      <div className="space-y-2.5">
                        {entries.map(([name, value]) => {
                          const pct = (value / total) * 100
                          const colors = SERVICE_COLORS[name] || SERVICE_COLORS['Otros']
                          return (
                            <div key={name} className={cn('flex items-center justify-between rounded-xl px-4 py-3', colors.bg)}>
                              <div className="flex items-center gap-2.5">
                                <div className={cn('w-3 h-3 rounded-full', colors.dot)} />
                                <span className={cn('text-sm font-semibold', colors.text)}>{name}</span>
                              </div>
                              <div className="text-right">
                                <span className={cn('text-sm font-bold', colors.text)}>{pct.toFixed(0)}%</span>
                                <span className="text-xs text-dark-light ml-2">{formatCurrency(value)}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })() : (
                  <div className="h-48 flex items-center justify-center text-dark-light text-sm">Sin datos</div>
                )}
              </div>
            </div>

            {/* ─── Pedidos Recientes ─── */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-semibold text-dark">Pedidos Recientes</h3>
                <Link
                  href="/admin/agendamientos"
                  className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  Ver todos →
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-10 text-center">
                  <svg className="w-12 h-12 mx-auto text-border mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-dark-light text-sm">No hay pedidos recientes</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-secondary/60">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-dark-light uppercase tracking-wider">Cliente</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-dark-light uppercase tracking-wider">Fecha</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-dark-light uppercase tracking-wider">Estado</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-dark-light uppercase tracking-wider">Pago</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-dark-light uppercase tracking-wider">Total</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {recentOrders.map(order => {
                        const status = statusConfig[order.status] || statusConfig.pending
                        const payment = paymentConfig[order.payment_status] || paymentConfig.pending
                        return (
                          <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-medium text-dark text-sm">{order.customer_name}</p>
                              <p className="text-xs text-dark-light">{order.customer_phone}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm text-dark">
                                {(() => { const [y,m,d] = order.event_date.split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString('es-CL'); })()}
                              </p>
                              <p className="text-xs text-dark-light">{order.event_time === 'AM' ? 'Mañana' : order.event_time === 'PM' ? 'Tarde' : order.event_time}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                status.bg
                              )}>
                                <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                                {status.label}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={cn('text-sm font-semibold', payment.color)}>
                                {payment.label}
                              </span>
                              {order.payment_status === 'partial' && order.deposit_paid && (
                                <p className="text-xs text-dark-light">
                                  Abono: {formatCurrency(order.deposit_amount)}
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <p className="font-bold text-dark tabular-nums">{formatCurrency(order.total)}</p>
                            </td>
                            <td className="px-5 py-4">
                              <button
                                onClick={() => handleOpenOrder(order.id)}
                                className="p-2 hover:bg-primary/10 rounded-lg text-dark-light hover:text-primary transition-colors"
                                title="Ver detalle"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <OrderDetailModal
        orderId={selectedOrderId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={loadData}
      />
    </div>
  )
}
