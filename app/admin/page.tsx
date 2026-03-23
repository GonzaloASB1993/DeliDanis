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

// Iconos
const Icons = {
  money: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  wallet: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  bank: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  ),
  calendar: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  chart: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  clock: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  alert: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  clipboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  pending: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

// Meses en español
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function AdminDashboardPage() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([])
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [serviceDistribution, setServiceDistribution] = useState<Record<string, number> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Modal state
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

  const statusColors: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700',
    confirmed: 'bg-green-100 text-green-700',
    in_production: 'bg-blue-100 text-blue-700',
    ready: 'bg-cyan-100 text-cyan-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
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

  const paymentStatusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Sin pago', color: 'text-red-600' },
    partial: { label: 'Abonado', color: 'text-orange-600' },
    paid: { label: 'Pagado', color: 'text-green-600' },
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Dashboard"
        subtitle={`Mostrando datos de ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
        actions={
          <div className="flex items-center gap-3">
            {/* Selector de mes */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>

            {/* Selector de año */}
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

      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Ingresos del Mes */}
              <div className="bg-white rounded-xl p-5 border border-border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-dark-light text-sm">Ingresos del Mes</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {formatCurrency(metrics?.ingresosMes || 0)}
                    </p>
                    <p className="text-xs text-dark-light mt-1">{MONTHS[selectedMonth - 1]} {selectedYear}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-full text-green-600">
                    {Icons.money}
                  </div>
                </div>
              </div>

              {/* Total Pagado */}
              <div className="bg-white rounded-xl p-5 border border-border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-dark-light text-sm">Total Pagado</p>
                    <p className="text-2xl font-bold text-cyan-600 mt-1">
                      {formatCurrency(metrics?.totalPagado || 0)}
                    </p>
                    <p className="text-xs text-dark-light mt-1">Pagos recibidos</p>
                  </div>
                  <div className="p-2 bg-cyan-100 rounded-full text-cyan-600">
                    {Icons.wallet}
                  </div>
                </div>
              </div>

              {/* Saldo por Cobrar */}
              <div className="bg-white rounded-xl p-5 border border-border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-dark-light text-sm">Saldo por Cobrar</p>
                    <p className="text-2xl font-bold text-red-500 mt-1">
                      {formatCurrency(metrics?.saldoPorCobrar || 0)}
                    </p>
                    <p className="text-xs text-dark-light mt-1">Pendiente de pago</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-full text-red-500">
                    {Icons.bank}
                  </div>
                </div>
              </div>

              {/* Eventos Realizados */}
              <div className="bg-white rounded-xl p-5 border border-border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-dark-light text-sm">Eventos Realizados</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {metrics?.eventosRealizados || 0}
                    </p>
                    <p className="text-xs text-dark-light mt-1">Mes seleccionado</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                    {Icons.calendar}
                  </div>
                </div>
              </div>

              {/* Utilidad del Mes */}
              <div className="bg-white rounded-xl p-5 border border-border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-dark-light text-sm">Utilidad del Mes</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                      {formatCurrency(metrics?.utilidadMes || 0)}
                    </p>
                    <p className="text-xs text-dark-light mt-1">Ganancia neta</p>
                  </div>
                  <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                    {Icons.chart}
                  </div>
                </div>
              </div>

              {/* Próximos Eventos */}
              <div className="bg-white rounded-xl p-5 border border-border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-dark-light text-sm">Próximos Eventos</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                      {metrics?.proximosEventos || 0}
                    </p>
                    <p className="text-xs text-dark-light mt-1">Próximos 7 días</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                    {Icons.clock}
                  </div>
                </div>
              </div>
            </div>

            {/* Alertas y Acciones Rápidas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Alertas */}
              {(metrics?.itemsStockBajo || 0) > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                      {Icons.alert}
                    </div>
                    <div>
                      <p className="font-semibold text-orange-800">Items con Stock Bajo</p>
                      <p className="text-orange-600 text-2xl font-bold">{metrics?.itemsStockBajo}</p>
                      <p className="text-orange-700 text-sm">Requiere atención</p>
                    </div>
                  </div>
                  <Link
                    href="/admin/inventario"
                    className="mt-3 inline-block text-sm text-orange-700 hover:text-orange-800 font-medium"
                  >
                    Ver inventario →
                  </Link>
                </div>
              )}

              {/* Resumen de estados */}
              <div className="bg-white rounded-xl p-5 border border-border lg:col-span-2">
                <h3 className="font-semibold text-dark mb-4">Resumen de Pedidos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{metrics?.pedidosPendientes || 0}</p>
                    <p className="text-xs text-orange-700">Pendientes</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{metrics?.pedidosConfirmados || 0}</p>
                    <p className="text-xs text-green-700">Confirmados</p>
                  </div>
                  <div className="text-center p-3 bg-cyan-50 rounded-lg">
                    <p className="text-2xl font-bold text-cyan-600">{metrics?.pedidosCompletados || 0}</p>
                    <p className="text-xs text-cyan-700">Completados</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">{metrics?.totalPedidos || 0}</p>
                    <p className="text-xs text-gray-700">Total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white rounded-xl p-5 border border-border">
              <h3 className="font-semibold text-dark mb-4">Acciones Rápidas</h3>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admin/agendamientos/nuevo"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Agendamiento
                </Link>
                <Link
                  href="/admin/catalogo"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border text-dark rounded-lg hover:bg-secondary transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Producto
                </Link>
                <Link
                  href="/admin/reportes"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border text-dark rounded-lg hover:bg-secondary transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Ver Reportes
                </Link>
                <Link
                  href="/"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border text-dark rounded-lg hover:bg-secondary transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ver Sitio
                </Link>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de ingresos mensuales */}
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="font-semibold text-dark mb-4">Ingresos Mensuales {selectedYear}</h3>
                {chartData ? (
                  <div className="flex items-end gap-1 h-48">
                    {(() => {
                      const maxValue = Math.max(...chartData.ingresos, 1)
                      const CHART_PX = 176 // h-48 (192px) minus ~16px for label
                      return chartData.labels.map((label, index) => {
                        const value = chartData.ingresos[index]
                        const barPx = Math.max((value / maxValue) * CHART_PX, 4)
                        const isSelected = index === selectedMonth - 1
                        return (
                          <div key={label} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-dark text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                              {formatCurrency(value)}
                            </div>
                            <div
                              className={cn(
                                'w-full rounded-t transition-all',
                                isSelected ? 'bg-primary' : 'bg-primary/30',
                                'group-hover:bg-primary/70'
                              )}
                              style={{ height: `${barPx}px` }}
                            />
                            <span className="text-[10px] text-dark-light">{label}</span>
                          </div>
                        )
                      })
                    })()}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-dark-light">
                    Sin datos
                  </div>
                )}
              </div>

              {/* Distribución por servicio */}
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="font-semibold text-dark mb-4">
                  Distribución por Servicio — {MONTHS[selectedMonth - 1]}
                </h3>
                {serviceDistribution ? (() => {
                  const total = Object.values(serviceDistribution).reduce((a, b) => a + b, 0)
                  const colors: Record<string, string> = {
                    'Tortas': 'bg-pink-400',
                    'Cocteleria': 'bg-purple-400',
                    'Pasteleria': 'bg-orange-400',
                    'Otros': 'bg-gray-400',
                  }
                  return (
                    <div className="space-y-4">
                      {Object.entries(serviceDistribution).map(([name, value]) => {
                        const percent = total > 0 ? (value / total) * 100 : 0
                        return (
                          <div key={name}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-dark font-medium">{name}</span>
                              <span className="text-dark-light">
                                {percent.toFixed(0)}% — {formatCurrency(value)}
                              </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-3">
                              <div
                                className={cn('h-3 rounded-full transition-all', colors[name] || 'bg-gray-400')}
                                style={{ width: `${Math.max(percent, 1)}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                      {total === 0 && (
                        <p className="text-dark-light text-center py-4">Sin datos para este período</p>
                      )}
                    </div>
                  )
                })() : (
                  <div className="h-48 flex items-center justify-center text-dark-light">
                    Sin datos
                  </div>
                )}
              </div>
            </div>

            {/* Pedidos Recientes */}
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-dark">Pedidos Recientes</h3>
                <Link
                  href="/admin/agendamientos"
                  className="text-sm text-primary hover:text-primary-hover"
                >
                  Ver todos →
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-8 text-center text-dark-light">
                  <p>No hay pedidos recientes</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary text-sm text-dark-light">
                      <tr>
                        <th className="text-left px-5 py-3 font-medium">Cliente</th>
                        <th className="text-left px-5 py-3 font-medium">Fecha</th>
                        <th className="text-left px-5 py-3 font-medium">Estado</th>
                        <th className="text-left px-5 py-3 font-medium">Pago</th>
                        <th className="text-right px-5 py-3 font-medium">Total</th>
                        <th className="text-center px-5 py-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentOrders.map(order => (
                        <tr key={order.id} className="hover:bg-secondary/50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-medium text-dark">{order.customer_name}</p>
                            <p className="text-sm text-dark-light">{order.customer_phone}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-dark">{(() => { const [y,m,d] = order.event_date.split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString('es-CL'); })()}</p>
                            <p className="text-sm text-dark-light">{order.event_time}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn(
                              'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                              statusColors[order.status]
                            )}>
                              {statusLabels[order.status]}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn(
                              'text-sm font-medium',
                              paymentStatusLabels[order.payment_status]?.color
                            )}>
                              {paymentStatusLabels[order.payment_status]?.label}
                            </span>
                            {order.payment_status === 'partial' && order.deposit_paid && (
                              <p className="text-xs text-dark-light">
                                Abono: {formatCurrency(order.deposit_amount)}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <p className="font-semibold text-dark">{formatCurrency(order.total)}</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenOrder(order.id)}
                                className="p-1.5 hover:bg-secondary rounded-lg text-dark-light hover:text-dark transition-colors"
                                title="Ver detalle"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={loadData}
      />
    </div>
  )
}
