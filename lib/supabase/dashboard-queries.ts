import { createServerSupabaseClient } from './server'
import { supabase } from './client'
import { getLowStockIngredients } from './inventory-queries'

export interface DashboardMetrics {
  ingresosMes: number
  totalPagado: number
  saldoPorCobrar: number
  eventosRealizados: number
  utilidadMes: number
  proximosEventos: number
  itemsStockBajo: number
  pedidosPendientes: number
  pedidosConfirmados: number
  pedidosCompletados: number
  totalPedidos: number
  productionInProgress: number
}

export interface OrderSummary {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  event_date: string
  event_time: string
  status: string
  payment_status: string
  total: number
  deposit_amount: number
  deposit_paid: boolean
  services: string[]
}

export interface ChartData {
  labels: string[]
  ingresos: number[]
  gastos: number[]
}

// Obtener métricas del dashboard para un período
export async function getDashboardMetrics(
  month: number,
  year: number
): Promise<DashboardMetrics> {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  try {
    // Pedidos del mes
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('event_date', startDate)
      .lte('event_date', endDate)

    if (ordersError) throw ordersError

    // Filtrar cancelados para métricas financieras
    const activeOrders = orders?.filter(o => o.status !== 'cancelled') || []

    // Contar por estado (incluyendo cancelados para conteo total)
    const pedidosPendientes = orders?.filter(o => o.status === 'pending').length || 0
    const pedidosConfirmados = orders?.filter(o => o.status === 'confirmed').length || 0
    const pedidosCompletados = orders?.filter(o => ['delivered', 'completed'].includes(o.status)).length || 0

    // Calcular ingresos y pagos SOLO de pedidos activos (no cancelados)
    const ingresosMes = activeOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
    const totalPagado = activeOrders.reduce((sum, o) => {
      if (o.payment_status === 'paid') return sum + (parseFloat(o.total) || 0)
      if (o.deposit_paid) return sum + (parseFloat(o.deposit_amount) || 0)
      return sum
    }, 0)
    const saldoPorCobrar = ingresosMes - totalPagado

    // Próximos eventos (7 días)
    const { data: upcomingOrders, error: upcomingError } = await supabase
      .from('orders')
      .select('id')
      .gte('event_date', today)
      .lte('event_date', nextWeek)
      .not('status', 'eq', 'cancelled')

    if (upcomingError) throw upcomingError

    // Items con stock bajo
    let itemsStockBajo = 0
    try {
      const lowStockItems = await getLowStockIngredients()
      itemsStockBajo = lowStockItems.length
    } catch {
      // Table may not exist yet
      itemsStockBajo = 0
    }

    // Production in progress
    let productionInProgress = 0
    try {
      const { count } = await supabase
        .from('production_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress')
      productionInProgress = count || 0
    } catch {
      // Table may not exist yet
      productionInProgress = 0
    }

    return {
      ingresosMes,
      totalPagado,
      saldoPorCobrar,
      eventosRealizados: pedidosCompletados,
      utilidadMes: ingresosMes, // Por ahora igual a ingresos (sin costos)
      proximosEventos: upcomingOrders?.length || 0,
      itemsStockBajo,
      pedidosPendientes,
      pedidosConfirmados,
      pedidosCompletados,
      totalPedidos: orders?.length || 0,
      productionInProgress,
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return {
      ingresosMes: 0,
      totalPagado: 0,
      saldoPorCobrar: 0,
      eventosRealizados: 0,
      utilidadMes: 0,
      proximosEventos: 0,
      itemsStockBajo: 0,
      pedidosPendientes: 0,
      pedidosConfirmados: 0,
      pedidosCompletados: 0,
      totalPedidos: 0,
      productionInProgress: 0,
    }
  }
}

// Obtener pedidos recientes
export async function getRecentOrders(limit = 5): Promise<OrderSummary[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        event_date,
        event_time,
        status,
        payment_status,
        total,
        deposit_amount,
        deposit_paid,
        customers (
          first_name,
          last_name,
          phone
        ),
        order_items (
          product_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map(order => {
      // Handle customer data - can be single object or array depending on relation
      const customer = Array.isArray(order.customers)
        ? order.customers[0]
        : order.customers
      const orderItems = order.order_items as { product_name: string }[] | null

      return {
        id: order.id,
        order_number: order.order_number,
        customer_name: customer
          ? `${customer.first_name} ${customer.last_name}`
          : 'Cliente',
        customer_phone: customer?.phone || '',
        event_date: order.event_date,
        event_time: order.event_time || '',
        status: order.status,
        payment_status: order.payment_status,
        total: parseFloat(order.total) || 0,
        deposit_amount: parseFloat(order.deposit_amount) || 0,
        deposit_paid: order.deposit_paid,
        services: orderItems?.map(item => item.product_name) || [],
      }
    })
  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return []
  }
}

// Obtener datos para gráfico de tendencia mensual
export async function getMonthlyChartData(year: number): Promise<ChartData> {
  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const ingresos: number[] = Array(12).fill(0)
  const gastos: number[] = Array(12).fill(0)

  try {
    // Obtener todos los pedidos del año
    const startOfYear = `${year}-01-01`
    const endOfYear = `${year}-12-31`

    const { data: orders, error } = await supabase
      .from('orders')
      .select('event_date, total, payment_status')
      .gte('event_date', startOfYear)
      .lte('event_date', endOfYear)
      .not('status', 'eq', 'cancelled')

    if (error) throw error

    // Agrupar por mes (parsear YYYY-MM-DD directamente para evitar timezone issues)
    orders?.forEach(order => {
      const parts = order.event_date.split('-')
      const month = parseInt(parts[1], 10) - 1 // 0-indexed
      if (month >= 0 && month < 12) {
        ingresos[month] += parseFloat(order.total) || 0
      }
    })

    // TODO: Agregar gastos cuando se implemente el módulo de transacciones

    return { labels, ingresos, gastos }
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return { labels, ingresos, gastos }
  }
}

// Obtener distribución por categoría de servicio
export async function getServiceDistribution(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  try {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        service_type,
        total_price,
        orders!inner (
          event_date,
          status
        )
      `)
      .gte('orders.event_date', startDate)
      .lte('orders.event_date', endDate)
      .neq('orders.status', 'cancelled')

    if (error) throw error

    const distribution: Record<string, number> = {
      'Tortas': 0,
      'Cocteleria': 0,
      'Pasteleria': 0,
      'Otros': 0,
    }

    data?.forEach(item => {
      const amount = parseFloat(item.total_price) || 0
      switch (item.service_type) {
        case 'torta':
          distribution['Tortas'] += amount
          break
        case 'cocteleria':
          distribution['Cocteleria'] += amount
          break
        case 'pasteleria':
          distribution['Pasteleria'] += amount
          break
        default:
          distribution['Otros'] += amount
      }
    })

    return distribution
  } catch (error) {
    console.error('Error fetching service distribution:', error)
    return {
      'Tortas': 0,
      'Cocteleria': 0,
      'Pasteleria': 0,
      'Otros': 0,
    }
  }
}
