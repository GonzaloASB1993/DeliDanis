'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/types/auth'
import { cn } from '@/lib/utils/cn'
import { getNotifications, type AppNotification } from '@/lib/supabase/notification-queries'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

const DISMISSED_KEY = 'delidanis_dismissed_notifications'

function getDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveDismissedIds(ids: Set<string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]))
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { profile, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [notificationsLoaded, setNotificationsLoaded] = useState(false)

  useEffect(() => {
    setDismissedIds(getDismissedIds())
    getNotifications().then(data => {
      setNotifications(data)
      setNotificationsLoaded(true)
    })
  }, [])

  const unreadCount = notifications.filter(n => !dismissedIds.has(n.id)).length

  const handleDismissNotification = (id: string) => {
    const newDismissed = new Set(dismissedIds)
    newDismissed.add(id)
    setDismissedIds(newDismissed)
    saveDismissedIds(newDismissed)
  }

  const handleSignOut = async () => {
    setShowDropdown(false)
    await signOut()
  }

  return (
    <header className="bg-white border-b border-border sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Titulo */}
        <div>
          <h1 className="font-display text-xl font-bold text-dark">{title}</h1>
          {subtitle && (
            <p className="text-dark-light text-sm">{subtitle}</p>
          )}
        </div>

        {/* Acciones y usuario */}
        <div className="flex items-center gap-4">
          {actions}

          {/* Notificaciones */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowDropdown(false)
              }}
              className="relative p-2 rounded-lg hover:bg-secondary text-dark-light hover:text-dark transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notificationsLoaded && unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-border z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="font-semibold text-dark text-sm">Notificaciones</h3>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-dark-light text-sm">
                      Sin notificaciones nuevas
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map(notification => {
                        const isDismissed = dismissedIds.has(notification.id)
                        return (
                          <Link
                            key={notification.id}
                            href={notification.link}
                            onClick={() => {
                              handleDismissNotification(notification.id)
                              setShowNotifications(false)
                            }}
                            className={cn(
                              'block px-4 py-3 hover:bg-secondary transition-colors border-b border-border/50 last:border-0',
                              isDismissed && 'opacity-50'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                                isDismissed
                                  ? 'bg-gray-300'
                                  : notification.type === 'pending_order' ? 'bg-orange-500' : 'bg-blue-500'
                              )} />
                              <div>
                                <p className="text-xs font-medium text-dark-light uppercase">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-dark mt-0.5">
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Usuario */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDropdown(!showDropdown)
                setShowNotifications(false)
              }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">
                  {profile?.first_name?.[0] || profile?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-dark">
                  {profile?.first_name || 'Usuario'}
                </p>
                <p className="text-xs text-dark-light">
                  {profile?.role ? ROLE_LABELS[profile.role] : 'Sin rol'}
                </p>
              </div>
              <svg className="w-4 h-4 text-dark-light hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-border py-1 z-50">
                  <Link
                    href="/admin/perfil"
                    onClick={() => setShowDropdown(false)}
                    className="block px-4 py-2 text-sm text-dark hover:bg-secondary transition-colors"
                  >
                    Mi perfil
                  </Link>
                  <Link
                    href="/admin/configuracion"
                    onClick={() => setShowDropdown(false)}
                    className="block px-4 py-2 text-sm text-dark hover:bg-secondary transition-colors"
                  >
                    Configuracion
                  </Link>
                  <hr className="my-1 border-border" />
                  <Link
                    href="/"
                    target="_blank"
                    onClick={() => setShowDropdown(false)}
                    className="block px-4 py-2 text-sm text-dark hover:bg-secondary transition-colors"
                  >
                    Ver sitio
                  </Link>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Cerrar sesion
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

// Componente para stats cards del header (como en la referencia)
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color: 'orange' | 'green' | 'cyan' | 'coral' | 'blue' | 'yellow'
  trend?: {
    value: number
    isPositive: boolean
  }
}

const colorClasses = {
  orange: 'bg-orange-400',
  green: 'bg-green-500',
  cyan: 'bg-cyan-500',
  coral: 'bg-red-400',
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-400',
}

export function StatCard({ label, value, icon, color, trend }: StatCardProps) {
  return (
    <div className={cn('rounded-xl p-5 text-white', colorClasses[color])}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {trend && (
            <p className={cn(
              'text-sm mt-1',
              trend.isPositive ? 'text-green-200' : 'text-red-200'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}% vs mes anterior
            </p>
          )}
        </div>
        <div className="text-white/30 text-4xl">
          {icon}
        </div>
      </div>
    </div>
  )
}
