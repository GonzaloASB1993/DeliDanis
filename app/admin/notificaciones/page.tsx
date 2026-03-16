'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Header } from '@/components/admin/Header'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format'
import {
  getLowStockAlerts,
  getUpcomingDeliveries,
  getOverdueOrders,
  getRecentActivity,
  type LowStockAlert,
  type UpcomingDelivery,
  type OverdueOrder,
  type RecentActivityItem,
} from '@/lib/supabase/notification-queries'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterTab = 'todas' | 'pedidos' | 'stock' | 'entregas' | 'sistema'

interface UnifiedNotification {
  id: string
  category: 'pedidos' | 'stock' | 'entregas' | 'sistema'
  urgency: 'urgent' | 'warning' | 'info'
  title: string
  description: string
  link: string
  timestamp: string
  actionLabel: string
  read: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp.includes('T') ? timestamp : timestamp + 'T12:00:00').getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'ahora mismo'
  if (diffMins < 60) return `hace ${diffMins} min`
  if (diffHours < 24) return `hace ${diffHours} h`
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} dias`
  return new Date(timestamp).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function deliveryTypeLabel(type: string) {
  return type === 'pickup' ? 'Retiro en tienda' : 'Envio a domicilio'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    in_production: 'En produccion',
    ready: 'Listo',
    delivered: 'Entregado',
    completed: 'Completado',
    cancelled: 'Cancelado',
  }
  return map[status] ?? status
}

// ---------------------------------------------------------------------------
// Icon components
// ---------------------------------------------------------------------------

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function IconTruck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  )
}

function IconBox({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

function IconOrder({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function IconActivity({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Notification card
// ---------------------------------------------------------------------------

const URGENCY_STYLES: Record<UnifiedNotification['urgency'], { border: string; icon: string; bg: string }> = {
  urgent: { border: 'border-l-red-500', icon: 'text-red-500', bg: 'bg-red-50' },
  warning: { border: 'border-l-yellow-500', icon: 'text-yellow-600', bg: 'bg-yellow-50' },
  info: { border: 'border-l-info', icon: 'text-info', bg: 'bg-blue-50' },
}

const CATEGORY_ICON: Record<UnifiedNotification['category'], React.ReactNode> = {
  pedidos: <IconOrder className="w-5 h-5" />,
  stock: <IconBox className="w-5 h-5" />,
  entregas: <IconTruck className="w-5 h-5" />,
  sistema: <IconActivity className="w-5 h-5" />,
}

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: UnifiedNotification
  onMarkRead: (id: string) => void
}) {
  const styles = URGENCY_STYLES[notification.urgency]

  return (
    <div className={cn(
      'bg-white rounded-xl border border-border border-l-4 p-4 flex gap-4 transition-all',
      styles.border,
      notification.read && 'opacity-60'
    )}>
      {/* Icon */}
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', styles.bg)}>
        <span className={styles.icon}>{CATEGORY_ICON[notification.category]}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-dark">{notification.title}</p>
            <p className="text-sm text-dark-light mt-0.5 leading-relaxed">{notification.description}</p>
          </div>
          <span className="text-xs text-dark-light whitespace-nowrap flex-shrink-0">
            {relativeTime(notification.timestamp)}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <Link
            href={notification.link}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {notification.actionLabel}
          </Link>
          {!notification.read && (
            <button
              onClick={() => onMarkRead(notification.id)}
              className="text-xs text-dark-light hover:text-dark transition-colors"
            >
              Marcar como leida
            </button>
          )}
        </div>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-dark-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <p className="font-display text-base font-semibold text-dark">Sin notificaciones</p>
      <p className="text-sm text-dark-light mt-1">{label}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-dark-light">{icon}</span>
      <h3 className="font-display text-base font-semibold text-dark">{title}</h3>
      {count > 0 && (
        <span className="ml-auto text-xs font-semibold text-dark-light bg-secondary px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'stock', label: 'Stock' },
  { id: 'entregas', label: 'Entregas' },
  { id: 'sistema', label: 'Sistema' },
]

export default function NotificacionesPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('todas')
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const [lowStock, setLowStock] = useState<LowStockAlert[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingDelivery[]>([])
  const [overdue, setOverdue] = useState<OverdueOrder[]>([])
  const [activity, setActivity] = useState<RecentActivityItem[]>([])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [stockData, upcomingData, overdueData, activityData] = await Promise.all([
        getLowStockAlerts(),
        getUpcomingDeliveries(3),
        getOverdueOrders(),
        getRecentActivity(20),
      ])
      setLowStock(stockData)
      setUpcoming(upcomingData)
      setOverdue(overdueData)
      setActivity(activityData)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Build unified notification list
  const allNotifications: UnifiedNotification[] = [
    // Overdue orders → urgent pedidos
    ...overdue.map(o => ({
      id: `overdue-${o.id}`,
      category: 'pedidos' as const,
      urgency: 'urgent' as const,
      title: 'Pedido vencido',
      description: `${o.order_number} de ${o.customer_name} — evento fue hace ${o.days_overdue} dia${o.days_overdue !== 1 ? 's' : ''}. Estado actual: ${statusLabel(o.status)}.`,
      link: '/admin/agendamientos',
      timestamp: o.event_date,
      actionLabel: 'Ver pedido',
      read: readIds.has(`overdue-${o.id}`),
    })),

    // Critically low stock (deficit >= min_stock * 0.5) → urgent stock
    ...lowStock.filter(s => s.deficit > 0).map(s => ({
      id: `stock-${s.id}`,
      category: 'stock' as const,
      urgency: (s.current_stock === 0 ? 'urgent' : 'warning') as UnifiedNotification['urgency'],
      title: s.current_stock === 0 ? 'Sin stock' : 'Stock bajo',
      description: `${s.name}${s.category ? ` (${s.category})` : ''} — actual: ${s.current_stock} ${s.unit}, minimo: ${s.min_stock} ${s.unit}.${s.supplier ? ` Proveedor: ${s.supplier}` : ''}`,
      link: '/admin/inventario',
      timestamp: new Date().toISOString(),
      actionLabel: 'Ir a inventario',
      read: readIds.has(`stock-${s.id}`),
    })),

    // Upcoming deliveries → warning or info entregas
    ...upcoming.map(d => ({
      id: `delivery-${d.id}`,
      category: 'entregas' as const,
      urgency: (d.days_until === 0 ? 'urgent' : d.days_until === 1 ? 'warning' : 'info') as UnifiedNotification['urgency'],
      title: d.days_until === 0
        ? 'Entrega hoy'
        : d.days_until === 1
          ? 'Entrega manana'
          : `Entrega en ${d.days_until} dias`,
      description: `${d.order_number} — ${d.customer_name} — ${deliveryTypeLabel(d.delivery_type)}${d.delivery_time ? ` a las ${d.delivery_time}` : ''}. Total: ${formatCurrency(d.total)}`,
      link: '/admin/agendamientos',
      timestamp: d.delivery_date,
      actionLabel: 'Ver pedido',
      read: readIds.has(`delivery-${d.id}`),
    })),

    // Recent activity → info sistema
    ...activity.map(a => ({
      id: a.id,
      category: 'sistema' as const,
      urgency: 'info' as const,
      title: a.title,
      description: a.description,
      link: a.link,
      timestamp: a.timestamp,
      actionLabel: a.activity_type === 'new_customer' ? 'Ver cliente' : 'Ver detalle',
      read: readIds.has(a.id),
    })),
  ]

  const filtered = activeTab === 'todas'
    ? allNotifications
    : allNotifications.filter(n => n.category === activeTab)

  const urgentNotifications = filtered.filter(n => n.urgency === 'urgent')
  const nonUrgentNotifications = filtered.filter(n => n.urgency !== 'urgent')

  const unreadCount = allNotifications.filter(n => !n.read).length

  function markRead(id: string) {
    setReadIds(prev => new Set([...prev, id]))
  }

  function markAllRead() {
    setReadIds(new Set(allNotifications.map(n => n.id)))
  }

  // Grouped non-urgent
  const entregasGroup = nonUrgentNotifications.filter(n => n.category === 'entregas')
  const stockGroup = nonUrgentNotifications.filter(n => n.category === 'stock')
  const sistemGroup = nonUrgentNotifications.filter(n => n.category === 'sistema')
  const pedidosGroup = nonUrgentNotifications.filter(n => n.category === 'pedidos')

  function renderGroups() {
    if (activeTab !== 'todas') {
      if (nonUrgentNotifications.length === 0 && urgentNotifications.length === 0) {
        return <EmptyState label="No hay notificaciones en esta categoria" />
      }
      return null // urgent + non-urgent already rendered above
    }

    return (
      <div className="space-y-8">
        {entregasGroup.length > 0 && (
          <div>
            <SectionHeader
              icon={<IconTruck className="w-4 h-4" />}
              title="Proximas entregas"
              count={entregasGroup.length}
            />
            <div className="space-y-3">
              {entregasGroup.map(n => (
                <NotificationCard key={n.id} notification={n} onMarkRead={markRead} />
              ))}
            </div>
          </div>
        )}

        {stockGroup.length > 0 && (
          <div>
            <SectionHeader
              icon={<IconBox className="w-4 h-4" />}
              title="Stock bajo"
              count={stockGroup.length}
            />
            <div className="space-y-3">
              {stockGroup.map(n => (
                <NotificationCard key={n.id} notification={n} onMarkRead={markRead} />
              ))}
            </div>
          </div>
        )}

        {pedidosGroup.length > 0 && (
          <div>
            <SectionHeader
              icon={<IconOrder className="w-4 h-4" />}
              title="Pedidos"
              count={pedidosGroup.length}
            />
            <div className="space-y-3">
              {pedidosGroup.map(n => (
                <NotificationCard key={n.id} notification={n} onMarkRead={markRead} />
              ))}
            </div>
          </div>
        )}

        {sistemGroup.length > 0 && (
          <div>
            <SectionHeader
              icon={<IconActivity className="w-4 h-4" />}
              title="Actividad reciente"
              count={sistemGroup.length}
            />
            <div className="space-y-3">
              {sistemGroup.map(n => (
                <NotificationCard key={n.id} notification={n} onMarkRead={markRead} />
              ))}
            </div>
          </div>
        )}

        {allNotifications.length === 0 && !loading && (
          <EmptyState label="Todo esta en orden. No hay alertas pendientes." />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header
        title="Centro de Notificaciones"
        subtitle="Alertas, entregas proximas y actividad reciente"
        actions={
          unreadCount > 0 ? (
            <button
              onClick={markAllRead}
              className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Marcar todas como leidas
            </button>
          ) : undefined
        }
      />

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-dark-light font-medium uppercase tracking-wide mb-1">Sin leer</p>
            <p className="text-2xl font-bold text-dark">{unreadCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-dark-light font-medium uppercase tracking-wide mb-1">Urgentes</p>
            <p className="text-2xl font-bold text-red-500">
              {allNotifications.filter(n => n.urgency === 'urgent').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-dark-light font-medium uppercase tracking-wide mb-1">Stock bajo</p>
            <p className="text-2xl font-bold text-yellow-600">{lowStock.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-dark-light font-medium uppercase tracking-wide mb-1">Entregas hoy</p>
            <p className="text-2xl font-bold text-dark">{upcoming.filter(u => u.days_until === 0).length}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-border p-1.5 mb-6 overflow-x-auto">
          {FILTER_TABS.map(tab => {
            const count = tab.id === 'todas'
              ? allNotifications.length
              : allNotifications.filter(n => n.category === tab.id).length
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-dark-light hover:text-dark hover:bg-secondary'
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full font-bold',
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-secondary text-dark-light'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-border border-l-4 border-l-border p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-secondary rounded w-1/3" />
                    <div className="h-3 bg-secondary rounded w-2/3" />
                    <div className="h-3 bg-secondary rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Urgent alerts section */}
            {urgentNotifications.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <IconAlert className="w-4 h-4 text-red-500" />
                  <h3 className="font-display text-base font-semibold text-dark">Alertas urgentes</h3>
                  <span className="ml-auto text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                    {urgentNotifications.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {urgentNotifications.map(n => (
                    <NotificationCard key={n.id} notification={n} onMarkRead={markRead} />
                  ))}
                </div>
              </div>
            )}

            {/* Non-urgent grouped or flat */}
            {activeTab === 'todas'
              ? renderGroups()
              : nonUrgentNotifications.length > 0
                ? (
                  <div className="space-y-3">
                    {nonUrgentNotifications.map(n => (
                      <NotificationCard key={n.id} notification={n} onMarkRead={markRead} />
                    ))}
                  </div>
                )
                : urgentNotifications.length === 0 && (
                  <EmptyState label="No hay notificaciones en esta categoria" />
                )
            }
          </div>
        )}
      </main>
    </div>
  )
}
