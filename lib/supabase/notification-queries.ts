import { supabase } from './client'

// ---------------------------------------------------------------------------
// Original types and functions (kept intact)
// ---------------------------------------------------------------------------

export interface AppNotification {
  id: string
  type: 'pending_order' | 'upcoming_event'
  title: string
  message: string
  link: string
  timestamp: string
}

export async function getNotifications(): Promise<AppNotification[]> {
  const notifications: AppNotification[] = []
  const today = new Date().toISOString().split('T')[0]
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  try {
    // Pedidos pendientes de confirmación
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('id, order_number, created_at, customers(first_name, last_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10)

    pendingOrders?.forEach(order => {
      const customer = Array.isArray(order.customers)
        ? order.customers[0]
        : order.customers
      const name = customer
        ? `${customer.first_name} ${customer.last_name}`
        : 'Cliente'
      notifications.push({
        id: `pending-${order.id}`,
        type: 'pending_order',
        title: 'Pedido pendiente',
        message: `${order.order_number} de ${name} espera confirmación`,
        link: '/admin/agendamientos',
        timestamp: order.created_at,
      })
    })

    // Eventos próximos (3 días)
    const { data: upcomingOrders } = await supabase
      .from('orders')
      .select('id, order_number, event_date, event_time, customers(first_name, last_name)')
      .gte('event_date', today)
      .lte('event_date', threeDaysFromNow)
      .not('status', 'in', '("cancelled","completed","delivered")')
      .order('event_date', { ascending: true })
      .limit(10)

    upcomingOrders?.forEach(order => {
      const eventDate = new Date(order.event_date + 'T12:00:00')
      const formattedDate = eventDate.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
      notifications.push({
        id: `upcoming-${order.id}`,
        type: 'upcoming_event',
        title: 'Evento próximo',
        message: `${order.order_number} el ${formattedDate}${order.event_time ? ` a las ${order.event_time}` : ''}`,
        link: '/admin/agendamientos',
        timestamp: order.event_date,
      })
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
  }

  return notifications
}

// ---------------------------------------------------------------------------
// Extended types for the full notifications center
// ---------------------------------------------------------------------------

export interface NotificationPreferences {
  low_stock_alerts: boolean
  upcoming_delivery_days: number
  overdue_order_alerts: boolean
  email_notifications: boolean
  whatsapp_notifications: boolean
}

export interface LowStockAlert {
  id: string
  name: string
  category: string | null
  unit: string
  current_stock: number
  min_stock: number
  deficit: number
  supplier: string | null
}

export interface UpcomingDelivery {
  id: string
  order_number: string
  delivery_date: string
  delivery_time: string | null
  delivery_type: string
  customer_name: string
  customer_phone: string | null
  status: string
  total: number
  days_until: number
}

export interface OverdueOrder {
  id: string
  order_number: string
  event_date: string
  status: string
  customer_name: string
  customer_phone: string | null
  total: number
  days_overdue: number
}

export interface RecentActivityItem {
  id: string
  activity_type: 'new_order' | 'status_change' | 'new_customer' | 'payment_received'
  title: string
  description: string
  link: string
  timestamp: string
  reference_id: string
}

// ---------------------------------------------------------------------------
// New query functions
// ---------------------------------------------------------------------------

/**
 * Fetches notification preferences from the settings table.
 * Returns sensible defaults if not configured.
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const defaults: NotificationPreferences = {
    low_stock_alerts: true,
    upcoming_delivery_days: 3,
    overdue_order_alerts: true,
    email_notifications: false,
    whatsapp_notifications: false,
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'notification_preferences')
      .maybeSingle()

    if (error || !data) return defaults

    return { ...defaults, ...(data.value as Partial<NotificationPreferences>) }
  } catch {
    return defaults
  }
}

/**
 * Returns ingredients whose current stock is at or below the minimum stock level.
 */
export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
  try {
    // Supabase JS client doesn't support column-to-column comparisons directly,
    // so we fetch all active ingredients and filter client-side.
    const { data: allIngredients, error: fetchError } = await supabase
      .from('ingredients')
      .select('id, name, category, unit, current_stock, min_stock, supplier')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (fetchError || !allIngredients) return []

    return allIngredients
      .filter(i => Number(i.current_stock) <= Number(i.min_stock))
      .map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        unit: i.unit,
        current_stock: Number(i.current_stock),
        min_stock: Number(i.min_stock),
        deficit: Number(i.min_stock) - Number(i.current_stock),
        supplier: i.supplier,
      }))
  } catch (error) {
    console.error('Error fetching low stock alerts:', error)
    return []
  }
}

/**
 * Returns orders with delivery_date in the next N days (inclusive of today).
 */
export async function getUpcomingDeliveries(days: number = 3): Promise<UpcomingDelivery[]> {
  try {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + days)
    const futureDateStr = futureDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        delivery_date,
        delivery_time,
        delivery_type,
        status,
        total,
        customers(first_name, last_name, phone)
      `)
      .gte('delivery_date', todayStr)
      .lte('delivery_date', futureDateStr)
      .not('status', 'in', '("cancelled","completed","delivered")')
      .order('delivery_date', { ascending: true })
      .limit(20)

    if (error || !data) return []

    const todayTime = today.setHours(0, 0, 0, 0)

    return data.map(order => {
      const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers
      const deliveryDate = new Date(order.delivery_date + 'T12:00:00')
      const daysUntil = Math.ceil((deliveryDate.getTime() - todayTime) / (1000 * 60 * 60 * 24))

      return {
        id: order.id,
        order_number: order.order_number,
        delivery_date: order.delivery_date,
        delivery_time: order.delivery_time,
        delivery_type: order.delivery_type,
        customer_name: customer
          ? `${customer.first_name} ${customer.last_name}`
          : 'Cliente desconocido',
        customer_phone: customer?.phone ?? null,
        status: order.status,
        total: Number(order.total),
        days_until: Math.max(0, daysUntil),
      }
    })
  } catch (error) {
    console.error('Error fetching upcoming deliveries:', error)
    return []
  }
}

/**
 * Returns orders that are confirmed or in_production but whose event_date has passed,
 * and are not yet marked as completed or delivered.
 */
export async function getOverdueOrders(): Promise<OverdueOrder[]> {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        event_date,
        status,
        total,
        customers(first_name, last_name, phone)
      `)
      .lte('event_date', yesterdayStr)
      .in('status', ['pending', 'confirmed', 'in_production', 'ready'])
      .order('event_date', { ascending: true })
      .limit(20)

    if (error || !data) return []

    const now = Date.now()

    return data.map(order => {
      const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers
      const eventDate = new Date(order.event_date + 'T12:00:00')
      const daysOverdue = Math.ceil((now - eventDate.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: order.id,
        order_number: order.order_number,
        event_date: order.event_date,
        status: order.status,
        customer_name: customer
          ? `${customer.first_name} ${customer.last_name}`
          : 'Cliente desconocido',
        customer_phone: customer?.phone ?? null,
        total: Number(order.total),
        days_overdue: Math.max(1, daysOverdue),
      }
    })
  } catch (error) {
    console.error('Error fetching overdue orders:', error)
    return []
  }
}

/**
 * Returns recent activity items: new orders and status changes.
 * Limit defaults to 20.
 */
export async function getRecentActivity(limit: number = 20): Promise<RecentActivityItem[]> {
  const activities: RecentActivityItem[] = []

  try {
    // Recent orders (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString()

    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total,
        created_at,
        customers(first_name, last_name)
      `)
      .gte('created_at', sevenDaysAgoStr)
      .order('created_at', { ascending: false })
      .limit(limit)

    recentOrders?.forEach(order => {
      const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers
      const customerName = customer
        ? `${customer.first_name} ${customer.last_name}`
        : 'Cliente'

      activities.push({
        id: `order-new-${order.id}`,
        activity_type: 'new_order',
        title: 'Nuevo pedido',
        description: `${order.order_number} de ${customerName}`,
        link: `/admin/agendamientos`,
        timestamp: order.created_at,
        reference_id: order.id,
      })
    })

    // Recent status changes from order_history (last 7 days)
    const { data: historyRows } = await supabase
      .from('order_history')
      .select(`
        id,
        order_id,
        status,
        notes,
        created_at,
        orders(order_number)
      `)
      .gte('created_at', sevenDaysAgoStr)
      .order('created_at', { ascending: false })
      .limit(limit)

    historyRows?.forEach(row => {
      const orderRef = Array.isArray(row.orders) ? row.orders[0] : row.orders
      const orderNumber = orderRef?.order_number ?? 'Pedido'

      activities.push({
        id: `history-${row.id}`,
        activity_type: 'status_change',
        title: 'Cambio de estado',
        description: `${orderNumber} cambiado a "${formatStatus(row.status)}"`,
        link: `/admin/agendamientos`,
        timestamp: row.created_at,
        reference_id: row.order_id,
      })
    })

    // Recent new customers (last 7 days)
    const { data: newCustomers } = await supabase
      .from('customers')
      .select('id, first_name, last_name, created_at')
      .gte('created_at', sevenDaysAgoStr)
      .order('created_at', { ascending: false })
      .limit(10)

    newCustomers?.forEach(customer => {
      activities.push({
        id: `customer-${customer.id}`,
        activity_type: 'new_customer',
        title: 'Nuevo cliente',
        description: `${customer.first_name} ${customer.last_name} se registro`,
        link: `/admin/clientes`,
        timestamp: customer.created_at,
        reference_id: customer.id,
      })
    })
  } catch (error) {
    console.error('Error fetching recent activity:', error)
  }

  // Sort by timestamp descending and limit
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    in_production: 'En produccion',
    ready: 'Listo',
    delivered: 'Entregado',
    completed: 'Completado',
    cancelled: 'Cancelado',
  }
  return labels[status] ?? status
}
