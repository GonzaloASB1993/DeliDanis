import { supabase } from './client'

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
