'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/admin/Header'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format'
import { supabase } from '@/lib/supabase/client'
import {
  getDashboardMetrics,
  getMonthlyChartData,
  getServiceDistribution,
  type DashboardMetrics,
  type ChartData,
} from '@/lib/supabase/dashboard-queries'
import {
  getFinanceSummary,
  getMonthlyFinanceData,
  getExpensesByCategory,
  getIncomeByCategory,
  type FinanceSummary,
  type MonthlyDataPoint,
  type CategoryBreakdown,
} from '@/lib/supabase/finance-queries'

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const YEARS = [2024, 2025, 2026]

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  in_production: 'En Producción',
  ready: 'Listo',
  delivered: 'Entregado',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#E8B86D',
  confirmed: '#7BA3C4',
  in_production: '#D4847C',
  ready: '#8FBC8F',
  delivered: '#6B9B6B',
  completed: '#B8860B',
  cancelled: '#9CA3AF',
}

const CATEGORY_COLORS = [
  '#D4847C', '#B8860B', '#7BA3C4', '#8FBC8F',
  '#E8B86D', '#9B7FD4', '#6B9B6B', '#C4746C',
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopCustomer {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  total_orders: number
  total_spent: number
  created_at: string
}

interface OrderStatusCount {
  status: string
  count: number
  total: number
}

interface DeliveryStats {
  pickup: number
  delivery: number
  pickupTotal: number
  deliveryTotal: number
}

interface EventTypeStats {
  event_type: string
  count: number
  total: number
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  {
    id: 'resumen',
    label: 'Resumen Ejecutivo',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'financiero',
    label: 'Análisis Financiero',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    id: 'clientes',
    label: 'Clientes Top',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'resultados',
    label: 'Estado de Resultados',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
]

// ─── Small helpers ────────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('bg-[#E8E4E0] rounded-lg animate-pulse', className)} />
}

function StatCard({
  label,
  value,
  sub,
  iconBg,
  iconColor,
  icon,
}: {
  label: string
  value: string
  sub?: string
  iconBg: string
  iconColor: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-[#E8E4E0]">
      <div className="flex items-start justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-[#5D5D5D] text-sm truncate">{label}</p>
          <p className={cn('text-xl font-bold mt-1', iconColor)}>{value}</p>
          {sub && <p className="text-xs text-[#5D5D5D] mt-0.5">{sub}</p>}
        </div>
        <div className={cn('p-2 rounded-full shrink-0', iconBg, iconColor)}>
          {icon}
        </div>
      </div>
    </div>
  )
}

/** Pure-CSS bar chart – renders stacked or individual bars from a data array */
function BarChart({
  data,
  maxValue,
  color = '#D4847C',
  secondColor,
  labelKey,
  valueKey,
  secondKey,
  height = 160,
}: {
  data: Record<string, unknown>[]
  maxValue: number
  color?: string
  secondColor?: string
  labelKey: string
  valueKey: string
  secondKey?: string
  height?: number
}) {
  const safeMax = maxValue || 1
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-1 min-w-0" style={{ height }}>
        {data.map((item, i) => {
          const primary = Number(item[valueKey]) || 0
          const secondary = secondKey ? Number(item[secondKey]) || 0 : 0
          const primaryH = Math.round((primary / safeMax) * height)
          const secondaryH = Math.round((secondary / safeMax) * height)
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-0.5 group relative"
              style={{ minWidth: 20 }}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#3D3D3D] text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                {secondKey
                  ? `${formatCurrency(primary)} / ${formatCurrency(secondary)}`
                  : formatCurrency(primary)}
              </div>
              <div className="flex items-end gap-0.5 w-full justify-center" style={{ height }}>
                {/* Primary bar */}
                <div
                  className="rounded-t transition-all duration-500"
                  style={{
                    height: primaryH,
                    backgroundColor: color,
                    width: secondKey ? '45%' : '70%',
                    minHeight: primary > 0 ? 2 : 0,
                  }}
                />
                {/* Secondary bar */}
                {secondKey && (
                  <div
                    className="rounded-t transition-all duration-500"
                    style={{
                      height: secondaryH,
                      backgroundColor: secondColor || '#E8E4E0',
                      width: '45%',
                      minHeight: secondary > 0 ? 2 : 0,
                    }}
                  />
                )}
              </div>
              <span className="text-[9px] text-[#5D5D5D] mt-1 w-full text-center truncate">
                {String(item[labelKey])}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Horizontal percentage bar for category distribution */
function CategoryBar({
  label,
  amount,
  percentage,
  color,
}: {
  label: string
  amount: number
  percentage: number
  color: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#3D3D3D] font-medium truncate pr-2">{label}</span>
        <span className="text-[#5D5D5D] shrink-0">{formatCurrency(amount)} ({percentage}%)</span>
      </div>
      <div className="h-2 bg-[#F7F3EF] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ─── CSV Export ────────────────────────────────────────────────────────────────

function buildCSV(rows: string[][]): string {
  return rows
    .map(row =>
      row
        .map(cell => {
          const str = String(cell ?? '')
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        })
        .join(',')
    )
    .join('\r\n')
}

function downloadCSV(content: string, filename: string) {
  const BOM = '\uFEFF' // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportesPage() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [activeTab, setActiveTab] = useState('resumen')
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // ── Data state ──
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [monthlyChart, setMonthlyChart] = useState<ChartData | null>(null)
  const [serviceDistribution, setServiceDistribution] = useState<Record<string, number>>({})
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null)
  const [monthlyFinance, setMonthlyFinance] = useState<MonthlyDataPoint[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<CategoryBreakdown[]>([])
  const [incomeByCategory, setIncomeByCategory] = useState<CategoryBreakdown[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [ordersByStatus, setOrdersByStatus] = useState<OrderStatusCount[]>([])
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats>({ pickup: 0, delivery: 0, pickupTotal: 0, deliveryTotal: 0 })
  const [eventTypeStats, setEventTypeStats] = useState<EventTypeStats[]>([])
  const [avgOrderValue, setAvgOrderValue] = useState(0)

  // ── Fetch all data ──
  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]

      const [
        metricsData,
        chartData,
        serviceData,
        financeData,
        monthlyFinanceData,
        expensesData,
        incomeData,
        customersData,
        ordersData,
      ] = await Promise.all([
        getDashboardMetrics(selectedMonth, selectedYear),
        getMonthlyChartData(selectedYear),
        getServiceDistribution(selectedMonth, selectedYear),
        getFinanceSummary(selectedMonth, selectedYear),
        getMonthlyFinanceData(selectedYear),
        getExpensesByCategory(selectedMonth, selectedYear),
        getIncomeByCategory(selectedMonth, selectedYear),
        supabase
          .from('customers')
          .select('id, first_name, last_name, email, phone, total_orders, total_spent, created_at')
          .order('total_spent', { ascending: false })
          .limit(20),
        supabase
          .from('orders')
          .select('status, total, delivery_type, event_type')
          .gte('event_date', startDate)
          .lte('event_date', endDate),
      ])

      setMetrics(metricsData)
      setMonthlyChart(chartData)
      setServiceDistribution(serviceData)
      setFinanceSummary(financeData)
      setMonthlyFinance(monthlyFinanceData)
      setExpensesByCategory(expensesData)
      setIncomeByCategory(incomeData)

      // Customers
      setTopCustomers((customersData.data || []) as TopCustomer[])

      // Orders breakdown
      const orders = ordersData.data || []
      const statusMap: Record<string, { count: number; total: number }> = {}
      let pickupCount = 0, deliveryCount = 0, pickupTotal = 0, deliveryTotal = 0
      const eventMap: Record<string, { count: number; total: number }> = {}
      let totalForAvg = 0, countForAvg = 0

      for (const o of orders) {
        if (o.status !== 'cancelled') {
          const amount = parseFloat(o.total) || 0
          totalForAvg += amount
          countForAvg += 1
        }

        // Status
        if (!statusMap[o.status]) statusMap[o.status] = { count: 0, total: 0 }
        statusMap[o.status].count += 1
        statusMap[o.status].total += parseFloat(o.total) || 0

        // Delivery
        if (o.delivery_type === 'pickup') {
          pickupCount++
          pickupTotal += parseFloat(o.total) || 0
        } else if (o.delivery_type === 'delivery') {
          deliveryCount++
          deliveryTotal += parseFloat(o.total) || 0
        }

        // Event type
        const etype = o.event_type || 'Sin especificar'
        if (!eventMap[etype]) eventMap[etype] = { count: 0, total: 0 }
        eventMap[etype].count += 1
        eventMap[etype].total += parseFloat(o.total) || 0
      }

      setOrdersByStatus(
        Object.entries(statusMap)
          .map(([status, v]) => ({ status, count: v.count, total: v.total }))
          .sort((a, b) => b.count - a.count)
      )
      setDeliveryStats({ pickup: pickupCount, delivery: deliveryCount, pickupTotal, deliveryTotal })
      setEventTypeStats(
        Object.entries(eventMap)
          .map(([event_type, v]) => ({ event_type, count: v.count, total: v.total }))
          .sort((a, b) => b.count - a.count)
      )
      setAvgOrderValue(countForAvg > 0 ? totalForAvg / countForAvg : 0)
    } catch (err) {
      console.error('Error fetching report data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ── CSV export per tab ──
  const handleExport = async () => {
    setIsExporting(true)
    const periodLabel = `${MONTHS[selectedMonth - 1]}_${selectedYear}`

    try {
      let csv = ''
      let filename = ''

      if (activeTab === 'resumen') {
        const rows: string[][] = [
          ['Métrica', 'Valor'],
          ['Ingresos del Mes', String(metrics?.ingresosMes ?? 0)],
          ['Total Pagado', String(metrics?.totalPagado ?? 0)],
          ['Saldo por Cobrar', String(metrics?.saldoPorCobrar ?? 0)],
          ['Eventos Realizados', String(metrics?.eventosRealizados ?? 0)],
          ['Próximos Eventos (7 días)', String(metrics?.proximosEventos ?? 0)],
          ['Total Pedidos del Mes', String(metrics?.totalPedidos ?? 0)],
          [],
          ['Distribución por Servicio', 'Monto'],
          ...Object.entries(serviceDistribution).map(([k, v]) => [k, String(v)]),
          [],
          ['Tendencia Mensual', ...((monthlyChart?.labels) ?? [])],
          ['Ingresos', ...((monthlyChart?.ingresos ?? []).map(String))],
          ['Gastos', ...((monthlyChart?.gastos ?? []).map(String))],
        ]
        csv = buildCSV(rows)
        filename = `Resumen_Ejecutivo_${periodLabel}.csv`
      } else if (activeTab === 'financiero') {
        const rows: string[][] = [
          ['Análisis Financiero', MONTHS[selectedMonth - 1], String(selectedYear)],
          [],
          ['Resumen', 'Valor'],
          ['Total Ingresos', String(financeSummary?.totalIncome ?? 0)],
          ['Total Gastos', String(financeSummary?.totalExpenses ?? 0)],
          ['Utilidad Neta', String(financeSummary?.netProfit ?? 0)],
          ['Pagos Pendientes', String(financeSummary?.pendingPayments ?? 0)],
          [],
          ['Ingresos por Categoría', 'Monto', 'Porcentaje', 'Transacciones'],
          ...incomeByCategory.map(c => [c.category, String(c.amount), `${c.percentage}%`, String(c.count)]),
          [],
          ['Gastos por Categoría', 'Monto', 'Porcentaje', 'Transacciones'],
          ...expensesByCategory.map(c => [c.category, String(c.amount), `${c.percentage}%`, String(c.count)]),
          [],
          ['Datos Mensuales', 'Mes', 'Ingresos', 'Gastos', 'Utilidad'],
          ...monthlyFinance.map(d => [d.monthName, String(d.income), String(d.expenses), String(d.profit)]),
        ]
        csv = buildCSV(rows)
        filename = `Analisis_Financiero_${periodLabel}.csv`
      } else if (activeTab === 'clientes') {
        const rows: string[][] = [
          ['Rank', 'Nombre', 'Email', 'Teléfono', 'Total Pedidos', 'Total Gastado', 'Promedio por Pedido'],
          ...topCustomers.map((c, i) => [
            String(i + 1),
            `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Sin nombre',
            c.email,
            c.phone || '-',
            String(c.total_orders),
            String(c.total_spent),
            String(c.total_orders > 0 ? Math.round(c.total_spent / c.total_orders) : 0),
          ]),
        ]
        csv = buildCSV(rows)
        filename = `Clientes_Top_${periodLabel}.csv`
      } else if (activeTab === 'operaciones') {
        const statusRows: string[][] = [
          ['Estado', 'Cantidad', 'Total'],
          ...ordersByStatus.map(s => [STATUS_LABELS[s.status] || s.status, String(s.count), String(s.total)]),
        ]
        const deliveryRows: string[][] = [
          [],
          ['Tipo Entrega', 'Cantidad', 'Total'],
          ['Retiro en tienda', String(deliveryStats.pickup), String(deliveryStats.pickupTotal)],
          ['Domicilio', String(deliveryStats.delivery), String(deliveryStats.deliveryTotal)],
        ]
        const eventRows: string[][] = [
          [],
          ['Tipo de Evento', 'Cantidad', 'Total'],
          ...eventTypeStats.map(e => [e.event_type, String(e.count), String(e.total)]),
        ]
        csv = buildCSV([...statusRows, ...deliveryRows, ...eventRows])
        filename = `Operaciones_${periodLabel}.csv`
      } else if (activeTab === 'resultados') {
        const totalIncome = financeSummary?.totalIncome ?? 0
        const totalExpenses = financeSummary?.totalExpenses ?? 0
        const net = totalIncome - totalExpenses
        const margin = totalIncome > 0 ? Math.round((net / totalIncome) * 100) : 0
        const rows: string[][] = [
          ['Estado de Resultados', MONTHS[selectedMonth - 1], String(selectedYear)],
          [],
          ['INGRESOS', '', ''],
          ...incomeByCategory.map(c => [c.category, '', String(c.amount)]),
          ['Total Ingresos', '', String(totalIncome)],
          [],
          ['GASTOS', '', ''],
          ...expensesByCategory.map(c => [c.category, '', String(c.amount)]),
          ['Total Gastos', '', String(totalExpenses)],
          [],
          ['UTILIDAD NETA', '', String(net)],
          ['MARGEN DE UTILIDAD', '', `${margin}%`],
        ]
        csv = buildCSV(rows)
        filename = `Estado_Resultados_${periodLabel}.csv`
      }

      if (csv) downloadCSV(csv, filename)
    } finally {
      setIsExporting(false)
    }
  }

  // ─── Shared computed values ───────────────────────────────────────────────

  const maxMonthlyIncome = Math.max(...(monthlyChart?.ingresos ?? [0]), 1)
  const maxMonthlyFinance = Math.max(
    ...monthlyFinance.map(d => Math.max(d.income, d.expenses)),
    1
  )
  const totalServiceAmount = Object.values(serviceDistribution).reduce((s, v) => s + v, 0) || 1

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header
        title="Reportes"
        subtitle={`${MONTHS[selectedMonth - 1]} ${selectedYear}`}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAll}
              title="Actualizar datos"
              className="p-2 rounded-lg hover:bg-[#F7F3EF] text-[#5D5D5D] hover:text-[#3D3D3D] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <Button
              size="sm"
              onClick={handleExport}
              isLoading={isExporting}
              className="gap-2 bg-[#8FBC8F] hover:bg-[#6B9B6B] text-white border-0"
            >
              {!isExporting && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              Exportar CSV
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-5">

        {/* ── Period Selectors ── */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-[#5D5D5D] mb-1 font-medium">Mes</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-[#E8E4E0] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4847C]/30"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#5D5D5D] mb-1 font-medium">Año</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-[#E8E4E0] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4847C]/30"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <p className="text-[#5D5D5D] text-sm pb-0.5">
            Mostrando datos de <span className="font-semibold text-[#3D3D3D]">{MONTHS[selectedMonth - 1]} {selectedYear}</span>
          </p>
        </div>

        {/* ── Quick KPI Row ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard
              label="Ingresos del Mes"
              value={formatCurrency(metrics?.ingresosMes ?? 0)}
              sub={MONTHS[selectedMonth - 1]}
              iconBg="bg-green-100"
              iconColor="text-green-600"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Total Pagado"
              value={formatCurrency(metrics?.totalPagado ?? 0)}
              sub="Pagos recibidos"
              iconBg="bg-cyan-100"
              iconColor="text-cyan-600"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
            />
            <StatCard
              label="Saldo por Cobrar"
              value={formatCurrency(metrics?.saldoPorCobrar ?? 0)}
              sub="Pendiente"
              iconBg="bg-red-100"
              iconColor="text-red-500"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
            <StatCard
              label="Total Pedidos"
              value={String(metrics?.totalPedidos ?? 0)}
              sub="En el mes"
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <StatCard
              label="Eventos Realizados"
              value={String(metrics?.eventosRealizados ?? 0)}
              sub="Completados"
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Próximos Eventos"
              value={String(metrics?.proximosEventos ?? 0)}
              sub="Próximos 7 días"
              iconBg="bg-yellow-100"
              iconColor="text-yellow-600"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        )}

        {/* ── Tabbed Content ── */}
        <div className="bg-white rounded-xl border border-[#E8E4E0] overflow-hidden">

          {/* Tab bar */}
          <div className="border-b border-[#E8E4E0] overflow-x-auto">
            <div className="flex">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                    activeTab === tab.id
                      ? 'text-[#D4847C] border-[#D4847C]'
                      : 'text-[#5D5D5D] border-transparent hover:text-[#3D3D3D] hover:border-[#E8E4E0]'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="p-6">

            {/* ════════════════════════════════
                TAB 1 — Resumen Ejecutivo
            ════════════════════════════════ */}
            {activeTab === 'resumen' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Monthly trend */}
                  <div className="bg-[#F7F3EF] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-[#3D3D3D]">Tendencia Mensual {selectedYear}</h3>
                      <div className="flex items-center gap-3 text-xs text-[#5D5D5D]">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#D4847C' }} />
                          Ingresos (pedidos)
                        </span>
                      </div>
                    </div>
                    {isLoading ? (
                      <SkeletonBlock className="h-48" />
                    ) : (
                      <BarChart
                        data={(monthlyChart?.labels ?? []).map((label, i) => ({
                          label,
                          ingresos: monthlyChart?.ingresos[i] ?? 0,
                        }))}
                        maxValue={maxMonthlyIncome}
                        color="#D4847C"
                        labelKey="label"
                        valueKey="ingresos"
                        height={180}
                      />
                    )}
                  </div>

                  {/* Service distribution */}
                  <div className="bg-[#F7F3EF] rounded-xl p-5">
                    <h3 className="font-semibold text-[#3D3D3D] mb-4">Distribución por Servicio</h3>
                    {isLoading ? (
                      <SkeletonBlock className="h-48" />
                    ) : Object.values(serviceDistribution).every(v => v === 0) ? (
                      <div className="h-48 flex items-center justify-center text-[#5D5D5D] text-sm">
                        Sin datos de distribución para este período
                      </div>
                    ) : (
                      <div className="space-y-3 mt-2">
                        {Object.entries(serviceDistribution)
                          .sort(([, a], [, b]) => b - a)
                          .map(([label, amount], i) => (
                            <CategoryBar
                              key={label}
                              label={label}
                              amount={amount}
                              percentage={Math.round((amount / totalServiceAmount) * 100)}
                              color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                            />
                          ))}
                        <div className="pt-2 border-t border-[#E8E4E0] flex justify-between text-sm font-semibold text-[#3D3D3D]">
                          <span>Total</span>
                          <span>{formatCurrency(totalServiceAmount)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status mini-summary */}
                {!isLoading && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Pendientes', value: metrics?.pedidosPendientes ?? 0, color: '#E8B86D', bg: 'bg-yellow-50' },
                      { label: 'Confirmados', value: metrics?.pedidosConfirmados ?? 0, color: '#7BA3C4', bg: 'bg-blue-50' },
                      { label: 'Completados', value: metrics?.pedidosCompletados ?? 0, color: '#6B9B6B', bg: 'bg-green-50' },
                      { label: 'Stock Bajo', value: metrics?.itemsStockBajo ?? 0, color: '#D4847C', bg: 'bg-red-50' },
                    ].map(item => (
                      <div key={item.label} className={cn('rounded-xl p-4 border', item.bg, 'border-transparent')}>
                        <p className="text-xs text-[#5D5D5D] font-medium">{item.label}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: item.color }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════
                TAB 2 — Análisis Financiero
            ════════════════════════════════ */}
            {activeTab === 'financiero' && (
              <div className="space-y-6">

                {/* Finance KPIs */}
                {isLoading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-24" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Ingresos', value: formatCurrency(financeSummary?.totalIncome ?? 0), color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
                      { label: 'Total Gastos', value: formatCurrency(financeSummary?.totalExpenses ?? 0), color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
                      { label: 'Utilidad Neta', value: formatCurrency(financeSummary?.netProfit ?? 0), color: (financeSummary?.netProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500', bg: 'bg-emerald-50 border-emerald-100' },
                      { label: 'Pagos Pendientes', value: formatCurrency(financeSummary?.pendingPayments ?? 0), color: 'text-[#B8860B]', bg: 'bg-yellow-50 border-yellow-100' },
                    ].map(c => (
                      <div key={c.label} className={cn('rounded-xl p-4 border', c.bg)}>
                        <p className="text-xs text-[#5D5D5D] font-medium">{c.label}</p>
                        <p className={cn('text-xl font-bold mt-1', c.color)}>{c.value}</p>
                        {c.label === 'Utilidad Neta' && financeSummary && financeSummary.totalIncome > 0 && (
                          <p className="text-xs text-[#5D5D5D] mt-0.5">
                            Margen: {Math.round((financeSummary.netProfit / financeSummary.totalIncome) * 100)}%
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Monthly finance chart */}
                <div className="bg-[#F7F3EF] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#3D3D3D]">Ingresos vs Gastos {selectedYear}</h3>
                    <div className="flex items-center gap-4 text-xs text-[#5D5D5D]">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm inline-block bg-[#8FBC8F]" />
                        Ingresos
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm inline-block bg-[#D4847C]" />
                        Gastos
                      </span>
                    </div>
                  </div>
                  {isLoading ? (
                    <SkeletonBlock className="h-48" />
                  ) : (
                    <BarChart
                      data={monthlyFinance.map(d => ({ label: d.monthName, income: d.income, expenses: d.expenses }))}
                      maxValue={maxMonthlyFinance}
                      color="#8FBC8F"
                      secondColor="#D4847C"
                      labelKey="label"
                      valueKey="income"
                      secondKey="expenses"
                      height={180}
                    />
                  )}
                </div>

                {/* Category breakdowns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Income by category */}
                  <div>
                    <h3 className="font-semibold text-[#3D3D3D] mb-3">Ingresos por Categoría</h3>
                    {isLoading ? (
                      <SkeletonBlock className="h-40" />
                    ) : incomeByCategory.length === 0 ? (
                      <p className="text-sm text-[#5D5D5D]">Sin transacciones de ingreso este mes</p>
                    ) : (
                      <div className="space-y-2.5">
                        {incomeByCategory.map((c, i) => (
                          <CategoryBar key={c.category} label={c.category} amount={c.amount} percentage={c.percentage} color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Expenses by category */}
                  <div>
                    <h3 className="font-semibold text-[#3D3D3D] mb-3">Gastos por Categoría</h3>
                    {isLoading ? (
                      <SkeletonBlock className="h-40" />
                    ) : expensesByCategory.length === 0 ? (
                      <p className="text-sm text-[#5D5D5D]">Sin transacciones de gasto este mes</p>
                    ) : (
                      <div className="space-y-2.5">
                        {expensesByCategory.map((c, i) => (
                          <CategoryBar key={c.category} label={c.category} amount={c.amount} percentage={c.percentage} color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════
                TAB 3 — Clientes Top
            ════════════════════════════════ */}
            {activeTab === 'clientes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#3D3D3D]">Top 20 Clientes por Valor Total</h3>
                  <span className="text-sm text-[#5D5D5D]">{topCustomers.length} clientes</span>
                </div>

                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonBlock key={i} className="h-10" />)}
                  </div>
                ) : topCustomers.length === 0 ? (
                  <div className="text-center py-16 text-[#5D5D5D]">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p>No hay clientes registrados aún</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E8E4E0]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#F7F3EF] text-[#5D5D5D] text-xs font-medium">
                          <th className="px-4 py-3 text-left w-10">#</th>
                          <th className="px-4 py-3 text-left">Cliente</th>
                          <th className="px-4 py-3 text-left">Email</th>
                          <th className="px-4 py-3 text-center">Pedidos</th>
                          <th className="px-4 py-3 text-right">Total Gastado</th>
                          <th className="px-4 py-3 text-right">Prom. por Pedido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCustomers.map((c, i) => {
                          const name = `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Sin nombre'
                          const avg = c.total_orders > 0 ? c.total_spent / c.total_orders : 0
                          return (
                            <tr
                              key={c.id}
                              className={cn(
                                'border-t border-[#E8E4E0] transition-colors hover:bg-[#F7F3EF]/50',
                                i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'
                              )}
                            >
                              <td className="px-4 py-3 font-bold text-[#5D5D5D]">
                                {i === 0 ? (
                                  <span className="text-[#B8860B]">{i + 1}</span>
                                ) : i === 1 ? (
                                  <span className="text-[#5D5D5D]">{i + 1}</span>
                                ) : (
                                  <span className="text-[#9CA3AF]">{i + 1}</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-[#D4847C]/20 flex items-center justify-center text-xs font-bold text-[#D4847C] shrink-0">
                                    {name[0]?.toUpperCase() || '?'}
                                  </div>
                                  <div>
                                    <p className="font-medium text-[#3D3D3D]">{name}</p>
                                    {c.phone && <p className="text-xs text-[#5D5D5D]">{c.phone}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[#5D5D5D] truncate max-w-[180px]">{c.email}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-0.5 rounded-full bg-[#F7F3EF] text-[#3D3D3D] font-medium text-xs">
                                  {c.total_orders}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-[#3D3D3D]">
                                {formatCurrency(c.total_spent)}
                              </td>
                              <td className="px-4 py-3 text-right text-[#5D5D5D]">
                                {formatCurrency(avg)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#F7F3EF] border-t border-[#E8E4E0] font-semibold text-[#3D3D3D]">
                          <td colSpan={3} className="px-4 py-3 text-right text-xs text-[#5D5D5D] font-normal">Totales</td>
                          <td className="px-4 py-3 text-center">
                            {topCustomers.reduce((s, c) => s + c.total_orders, 0)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(topCustomers.reduce((s, c) => s + c.total_spent, 0))}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════
                TAB 4 — Operaciones
            ════════════════════════════════ */}
            {activeTab === 'operaciones' && (
              <div className="space-y-6">

                {/* Avg order value + totals */}
                {isLoading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-20" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#F7F3EF] rounded-xl p-4 border border-[#E8E4E0]">
                      <p className="text-xs text-[#5D5D5D] font-medium">Total Pedidos (mes)</p>
                      <p className="text-2xl font-bold text-[#3D3D3D] mt-1">{metrics?.totalPedidos ?? 0}</p>
                    </div>
                    <div className="bg-[#F7F3EF] rounded-xl p-4 border border-[#E8E4E0]">
                      <p className="text-xs text-[#5D5D5D] font-medium">Valor Promedio</p>
                      <p className="text-2xl font-bold text-[#B8860B] mt-1">{formatCurrency(avgOrderValue)}</p>
                    </div>
                    <div className="bg-[#F7F3EF] rounded-xl p-4 border border-[#E8E4E0]">
                      <p className="text-xs text-[#5D5D5D] font-medium">Retiro en Tienda</p>
                      <p className="text-2xl font-bold text-[#7BA3C4] mt-1">{deliveryStats.pickup}</p>
                      <p className="text-xs text-[#5D5D5D]">{formatCurrency(deliveryStats.pickupTotal)}</p>
                    </div>
                    <div className="bg-[#F7F3EF] rounded-xl p-4 border border-[#E8E4E0]">
                      <p className="text-xs text-[#5D5D5D] font-medium">Domicilio</p>
                      <p className="text-2xl font-bold text-[#D4847C] mt-1">{deliveryStats.delivery}</p>
                      <p className="text-xs text-[#5D5D5D]">{formatCurrency(deliveryStats.deliveryTotal)}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Orders by status */}
                  <div>
                    <h3 className="font-semibold text-[#3D3D3D] mb-3">Pedidos por Estado</h3>
                    {isLoading ? (
                      <SkeletonBlock className="h-48" />
                    ) : ordersByStatus.length === 0 ? (
                      <p className="text-sm text-[#5D5D5D]">Sin pedidos en este período</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-[#E8E4E0]">
                        <table className="w-full text-sm min-w-[320px]">
                          <thead>
                            <tr className="bg-[#F7F3EF] text-[#5D5D5D] text-xs font-medium">
                              <th className="px-4 py-3 text-left">Estado</th>
                              <th className="px-4 py-3 text-center">Cantidad</th>
                              <th className="px-4 py-3 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ordersByStatus.map((s, i) => (
                              <tr key={s.status} className={cn('border-t border-[#E8E4E0]', i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]')}>
                                <td className="px-4 py-3">
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                                    style={{ backgroundColor: STATUS_COLORS[s.status] || '#9CA3AF' }}
                                  >
                                    {STATUS_LABELS[s.status] || s.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center font-semibold text-[#3D3D3D]">{s.count}</td>
                                <td className="px-4 py-3 text-right text-[#5D5D5D]">{formatCurrency(s.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Orders by event type */}
                  <div>
                    <h3 className="font-semibold text-[#3D3D3D] mb-3">Pedidos por Tipo de Evento</h3>
                    {isLoading ? (
                      <SkeletonBlock className="h-48" />
                    ) : eventTypeStats.length === 0 ? (
                      <p className="text-sm text-[#5D5D5D]">Sin datos de tipo de evento</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-[#E8E4E0]">
                        <table className="w-full text-sm min-w-[320px]">
                          <thead>
                            <tr className="bg-[#F7F3EF] text-[#5D5D5D] text-xs font-medium">
                              <th className="px-4 py-3 text-left">Tipo de Evento</th>
                              <th className="px-4 py-3 text-center">Pedidos</th>
                              <th className="px-4 py-3 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eventTypeStats.map((e, i) => (
                              <tr key={e.event_type} className={cn('border-t border-[#E8E4E0]', i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]')}>
                                <td className="px-4 py-3">
                                  <span className="capitalize text-[#3D3D3D]">{e.event_type}</span>
                                </td>
                                <td className="px-4 py-3 text-center font-semibold text-[#3D3D3D]">{e.count}</td>
                                <td className="px-4 py-3 text-right text-[#5D5D5D]">{formatCurrency(e.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery ratio bar */}
                {!isLoading && (deliveryStats.pickup + deliveryStats.delivery) > 0 && (
                  <div className="bg-[#F7F3EF] rounded-xl p-4">
                    <h3 className="font-semibold text-[#3D3D3D] mb-3 text-sm">Distribución Tipo de Entrega</h3>
                    <div className="flex gap-0 rounded-full overflow-hidden h-6">
                      <div
                        className="flex items-center justify-center text-xs text-white font-medium transition-all"
                        style={{
                          backgroundColor: '#7BA3C4',
                          width: `${Math.round((deliveryStats.pickup / (deliveryStats.pickup + deliveryStats.delivery)) * 100)}%`,
                        }}
                      >
                        {deliveryStats.pickup > 0 && `${Math.round((deliveryStats.pickup / (deliveryStats.pickup + deliveryStats.delivery)) * 100)}%`}
                      </div>
                      <div
                        className="flex items-center justify-center text-xs text-white font-medium transition-all"
                        style={{
                          backgroundColor: '#D4847C',
                          width: `${Math.round((deliveryStats.delivery / (deliveryStats.pickup + deliveryStats.delivery)) * 100)}%`,
                        }}
                      >
                        {deliveryStats.delivery > 0 && `${Math.round((deliveryStats.delivery / (deliveryStats.pickup + deliveryStats.delivery)) * 100)}%`}
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-[#5D5D5D]">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#7BA3C4] inline-block" />Retiro ({deliveryStats.pickup})</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#D4847C] inline-block" />Domicilio ({deliveryStats.delivery})</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════
                TAB 5 — Estado de Resultados
            ════════════════════════════════ */}
            {activeTab === 'resultados' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#3D3D3D]">Estado de Resultados</h3>
                    <p className="text-sm text-[#5D5D5D] mt-0.5">{MONTHS[selectedMonth - 1]} {selectedYear}</p>
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 10 }).map((_, i) => <SkeletonBlock key={i} className="h-10" />)}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E8E4E0]">
                    <table className="w-full text-sm min-w-[360px]">
                      <thead>
                        <tr className="bg-[#F7F3EF] text-[#5D5D5D] text-xs font-medium">
                          <th className="px-5 py-3 text-left">Concepto</th>
                          <th className="px-5 py-3 text-right">Monto</th>
                          <th className="px-5 py-3 text-right w-24">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Income section */}
                        <tr className="bg-green-50 border-t border-[#E8E4E0]">
                          <td colSpan={3} className="px-5 py-2.5 font-semibold text-green-700 text-xs uppercase tracking-wide">
                            Ingresos
                          </td>
                        </tr>
                        {incomeByCategory.length === 0 ? (
                          <tr className="border-t border-[#E8E4E0]">
                            <td colSpan={3} className="px-5 py-3 text-[#5D5D5D] text-sm italic">Sin ingresos registrados</td>
                          </tr>
                        ) : incomeByCategory.map((c, i) => (
                          <tr key={c.category} className={cn('border-t border-[#E8E4E0]', i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]')}>
                            <td className="px-5 py-3 pl-8 text-[#3D3D3D]">{c.category}</td>
                            <td className="px-5 py-3 text-right font-medium text-green-600">{formatCurrency(c.amount)}</td>
                            <td className="px-5 py-3 text-right text-[#5D5D5D]">{c.percentage}%</td>
                          </tr>
                        ))}
                        {/* Income total */}
                        <tr className="border-t-2 border-green-200 bg-green-50">
                          <td className="px-5 py-3 font-bold text-[#3D3D3D]">Total Ingresos</td>
                          <td className="px-5 py-3 text-right font-bold text-green-700">{formatCurrency(financeSummary?.totalIncome ?? 0)}</td>
                          <td className="px-5 py-3 text-right font-bold text-green-700">100%</td>
                        </tr>

                        {/* Expense section */}
                        <tr className="bg-red-50 border-t-2 border-[#E8E4E0]">
                          <td colSpan={3} className="px-5 py-2.5 font-semibold text-red-700 text-xs uppercase tracking-wide">
                            Gastos
                          </td>
                        </tr>
                        {expensesByCategory.length === 0 ? (
                          <tr className="border-t border-[#E8E4E0]">
                            <td colSpan={3} className="px-5 py-3 text-[#5D5D5D] text-sm italic">Sin gastos registrados</td>
                          </tr>
                        ) : expensesByCategory.map((c, i) => (
                          <tr key={c.category} className={cn('border-t border-[#E8E4E0]', i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]')}>
                            <td className="px-5 py-3 pl-8 text-[#3D3D3D]">{c.category}</td>
                            <td className="px-5 py-3 text-right font-medium text-red-500">({formatCurrency(c.amount)})</td>
                            <td className="px-5 py-3 text-right text-[#5D5D5D]">
                              {financeSummary && financeSummary.totalIncome > 0
                                ? `${Math.round((c.amount / financeSummary.totalIncome) * 100)}%`
                                : '-'}
                            </td>
                          </tr>
                        ))}
                        {/* Expense total */}
                        <tr className="border-t-2 border-red-200 bg-red-50">
                          <td className="px-5 py-3 font-bold text-[#3D3D3D]">Total Gastos</td>
                          <td className="px-5 py-3 text-right font-bold text-red-600">({formatCurrency(financeSummary?.totalExpenses ?? 0)})</td>
                          <td className="px-5 py-3 text-right font-bold text-red-600">
                            {financeSummary && financeSummary.totalIncome > 0
                              ? `${Math.round((financeSummary.totalExpenses / financeSummary.totalIncome) * 100)}%`
                              : '-'}
                          </td>
                        </tr>

                        {/* Net result */}
                        <tr className={cn(
                          'border-t-4',
                          (financeSummary?.netProfit ?? 0) >= 0 ? 'border-emerald-400 bg-emerald-50' : 'border-red-400 bg-red-50'
                        )}>
                          <td className="px-5 py-4 font-bold text-[#3D3D3D] text-base">Utilidad Neta</td>
                          <td className={cn(
                            'px-5 py-4 text-right font-bold text-lg',
                            (financeSummary?.netProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                          )}>
                            {formatCurrency(financeSummary?.netProfit ?? 0)}
                          </td>
                          <td className={cn(
                            'px-5 py-4 text-right font-bold',
                            (financeSummary?.netProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                          )}>
                            {financeSummary && financeSummary.totalIncome > 0
                              ? `${Math.round((financeSummary.netProfit / financeSummary.totalIncome) * 100)}%`
                              : '-'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Mini insight box */}
                {!isLoading && financeSummary && (
                  <div className={cn(
                    'rounded-xl p-4 border text-sm',
                    financeSummary.netProfit >= 0
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      : 'bg-red-50 border-red-100 text-red-700'
                  )}>
                    <span className="font-semibold">Resumen: </span>
                    {financeSummary.netProfit >= 0
                      ? `En ${MONTHS[selectedMonth - 1]} se generó una utilidad de ${formatCurrency(financeSummary.netProfit)} con un margen del ${financeSummary.totalIncome > 0 ? Math.round((financeSummary.netProfit / financeSummary.totalIncome) * 100) : 0}%.`
                      : `En ${MONTHS[selectedMonth - 1]} los gastos superaron los ingresos por ${formatCurrency(Math.abs(financeSummary.netProfit))}.`}
                    {financeSummary.pendingPayments > 0 && (
                      <span> Quedan {formatCurrency(financeSummary.pendingPayments)} por cobrar de pedidos activos.</span>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
