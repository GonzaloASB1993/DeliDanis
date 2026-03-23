'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/admin/Header'
import { getContactMessages, markMessageAsRead, type ContactMessage } from '@/lib/supabase/message-queries'

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Ahora mismo'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

export default function MensajesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    getContactMessages().then(data => {
      setMessages(data)
      setIsLoading(false)
    })
  }, [])

  const handleExpand = async (msg: ContactMessage) => {
    if (expandedId === msg.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(msg.id)
    if (!msg.is_read) {
      await markMessageAsRead(msg.id)
      setMessages(prev =>
        prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m)
      )
    }
  }

  const unreadCount = messages.filter(m => !m.is_read).length

  return (
    <div className="min-h-screen">
      <Header
        title="Mensajes"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} mensaje${unreadCount > 1 ? 's' : ''} sin leer`
            : 'Todos los mensajes leídos'
        }
      />
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3 max-w-3xl">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-border p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-dark-light">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-lg font-medium">Sin mensajes</p>
            <p className="text-sm mt-1">Los mensajes del formulario de contacto aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`bg-white rounded-xl border transition-all cursor-pointer ${
                  !msg.is_read ? 'border-primary/40 shadow-sm' : 'border-border'
                }`}
                onClick={() => handleExpand(msg)}
              >
                <div className="flex items-start justify-between p-5 gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {!msg.is_read && (
                      <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-primary" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-dark">{msg.name}</span>
                        <span className="text-dark-light text-sm">{msg.email}</span>
                        {msg.phone && <span className="text-dark-light text-sm">{msg.phone}</span>}
                      </div>
                      {msg.subject && (
                        <p className="text-sm font-medium text-dark mt-0.5">{msg.subject}</p>
                      )}
                      {expandedId !== msg.id && (
                        <p className="text-sm text-dark-light mt-1 line-clamp-1">{msg.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-dark-light whitespace-nowrap">
                      {timeAgo(msg.created_at)}
                    </p>
                    {!msg.is_read && (
                      <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        Nuevo
                      </span>
                    )}
                  </div>
                </div>
                {expandedId === msg.id && (
                  <div className="px-5 pb-5 border-t border-border pt-4">
                    <p className="text-dark whitespace-pre-wrap text-sm">{msg.message}</p>
                    <div className="flex gap-3 mt-4">
                      <a
                        href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || 'Tu mensaje')}`}
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition-colors"
                      >
                        Responder por email
                      </a>
                      {msg.phone && (
                        <a
                          href={`https://wa.me/${msg.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-border text-dark rounded-lg text-sm hover:bg-secondary transition-colors"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
