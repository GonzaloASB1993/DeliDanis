'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { gsap } from 'gsap'
import { getOrderByNumber, type OrderWithDetails } from '@/lib/supabase/orders-queries'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/format'

if (typeof window !== 'undefined') {
  gsap.registerPlugin()
}

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string; step: number }> = {
  pending: {
    label: 'Pendiente',
    color: 'text-warning',
    bgColor: 'bg-warning/15',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    step: 0,
  },
  confirmed: {
    label: 'Confirmado',
    color: 'text-info',
    bgColor: 'bg-info/15',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    step: 1,
  },
  in_production: {
    label: 'En Produccion',
    color: 'text-primary',
    bgColor: 'bg-primary/15',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    step: 2,
  },
  ready: {
    label: 'Listo',
    color: 'text-success-dark',
    bgColor: 'bg-success/15',
    icon: 'M5 13l4 4L19 7',
    step: 3,
  },
  delivered: {
    label: 'Entregado',
    color: 'text-success-dark',
    bgColor: 'bg-success/15',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    step: 4,
  },
  completed: {
    label: 'Completado',
    color: 'text-success-dark',
    bgColor: 'bg-success/15',
    icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
    step: 5,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-primary',
    bgColor: 'bg-primary/15',
    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    step: -1,
  },
}

const STEPS = [
  { key: 'pending', label: 'Pendiente' },
  { key: 'confirmed', label: 'Confirmado' },
  { key: 'in_production', label: 'En Produccion' },
  { key: 'ready', label: 'Listo' },
  { key: 'delivered', label: 'Entregado' },
  { key: 'completed', label: 'Completado' },
]

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pendiente', color: 'text-warning', bgColor: 'bg-warning/15' },
  partial: { label: 'Abono parcial', color: 'text-info', bgColor: 'bg-info/15' },
  paid: { label: 'Pagado', color: 'text-success-dark', bgColor: 'bg-success/15' },
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: 'Matrimonio',
  quinceanera: 'Quinceanos',
  birthday: 'Cumpleanos',
  corporate: 'Corporativo',
  anniversary: 'Aniversario',
  baby_shower: 'Baby Shower',
  other: 'Otro',
}

export default function SeguimientoDetallePage() {
  const params = useParams()
  const codigo = params.codigo as string

  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadOrder() {
      setIsLoading(true)
      const result = await getOrderByNumber(codigo)
      if (result) {
        setOrder(result)
      } else {
        setNotFound(true)
      }
      setIsLoading(false)
    }
    if (codigo) loadOrder()
  }, [codigo])

  // Animate content once loaded
  useEffect(() => {
    if (isLoading || !pageRef.current) return

    const ctx = gsap.context(() => {
      gsap.from('[data-animate]', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
      })
    }, pageRef)

    return () => ctx.revert()
  }, [isLoading, order, notFound])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-alt">
        <div className="container mx-auto px-4 max-w-3xl py-16 md:py-24">
          <div className="text-center mb-10">
            <div className="h-8 w-48 bg-primary/10 rounded-lg mx-auto mb-4 animate-pulse" />
            <div className="h-5 w-64 bg-primary/5 rounded mx-auto animate-pulse" />
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse space-y-6">
            <div className="flex justify-between">
              <div className="h-10 w-32 bg-secondary rounded-lg" />
              <div className="h-8 w-24 bg-secondary rounded-full" />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex-1 h-2 bg-secondary rounded-full" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-secondary rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not found state
  if (notFound) {
    return (
      <div className="min-h-screen bg-light-alt" ref={pageRef}>
        <div className="container mx-auto px-4 max-w-lg py-20 md:py-32 text-center">
          <div data-animate className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-border/30">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-dark mb-2">Pedido no encontrado</h1>
            <p className="text-dark-light mb-6">
              No encontramos ningun pedido con el codigo <span className="font-mono font-semibold text-dark">{codigo}</span>. Verifica el numero e intenta nuevamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/seguimiento"
                className="px-6 py-3 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary-hover transition-colors"
              >
                Intentar de nuevo
              </Link>
              <a
                href="https://wa.me/56939282764"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border-2 border-dark/15 text-dark rounded-full font-semibold text-sm hover:border-dark/30 transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Escribenos
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) return null

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const currentStep = statusConfig.step
  const isCancelled = order.status === 'cancelled'
  const paymentConfig = PAYMENT_STATUS_LABELS[order.payment_status] || PAYMENT_STATUS_LABELS.pending
  const totalPaid = order.payments?.reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0) || 0
  const remaining = (parseFloat(String(order.total)) || 0) - totalPaid

  return (
    <div className="min-h-screen bg-light-alt" ref={pageRef}>
      <div className="container mx-auto px-4 max-w-3xl py-10 md:py-16">
        {/* Back link */}
        <div data-animate className="mb-6">
          <Link
            href="/seguimiento"
            className="inline-flex items-center gap-1.5 text-sm text-dark-light hover:text-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Buscar otro pedido
          </Link>
        </div>

        {/* Order Header */}
        <div data-animate className="bg-white rounded-2xl p-5 md:p-7 shadow-sm border border-border/30 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <p className="text-xs text-dark-light uppercase tracking-wider font-medium mb-1">Pedido</p>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-dark">{order.order_number}</h1>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold ${statusConfig.color} ${statusConfig.bgColor} self-start`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={statusConfig.icon} />
              </svg>
              {statusConfig.label}
            </span>
          </div>

          {/* Progress Stepper */}
          {!isCancelled && (
            <div className="overflow-x-auto">
            <div className="relative min-w-[420px]">
              {/* Progress bar background */}
              <div className="absolute top-4 left-0 right-0 h-1 bg-border/60 rounded-full mx-6" />
              {/* Progress bar fill */}
              <div
                className="absolute top-4 left-0 h-1 bg-primary rounded-full mx-6 transition-all duration-700"
                style={{ width: `calc(${(currentStep / (STEPS.length - 1)) * 100}% - 3rem)`, marginLeft: '1.5rem' }}
              />

              <div className="relative flex justify-between">
                {STEPS.map((step, i) => {
                  const isCompleted = i <= currentStep
                  const isCurrent = i === currentStep
                  return (
                    <div key={step.key} className="flex flex-col items-center" style={{ width: `${100 / STEPS.length}%` }}>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                          isCompleted
                            ? 'bg-primary text-white shadow-[0_2px_8px_rgba(212,132,124,0.4)]'
                            : 'bg-white border-2 border-border text-dark-light'
                        } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}
                      >
                        {isCompleted ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span className={`text-[10px] sm:text-xs mt-2 text-center leading-tight font-medium ${
                        isCompleted ? 'text-primary' : 'text-dark-light/60'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            </div>
          )}

          {/* Cancelled notice */}
          {isCancelled && (
            <div className="flex items-center gap-3 p-4 bg-primary/8 rounded-xl">
              <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-dark">
                Este pedido fue cancelado. Si tienes preguntas, contactanos por WhatsApp.
              </p>
            </div>
          )}
        </div>

        {/* Order Details Grid */}
        <div data-animate className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Event Info */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/30">
            <h3 className="text-xs text-dark-light uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Evento
            </h3>
            <div className="space-y-2.5">
              {order.event_type && (
                <div className="flex justify-between">
                  <span className="text-sm text-dark-light">Tipo</span>
                  <span className="text-sm font-medium text-dark">{EVENT_TYPE_LABELS[order.event_type] || order.event_type}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-dark-light">Fecha</span>
                <span className="text-sm font-medium text-dark">{formatDate(order.event_date + 'T12:00:00')}</span>
              </div>
              {order.event_time && (
                <div className="flex justify-between">
                  <span className="text-sm text-dark-light">Hora</span>
                  <span className="text-sm font-medium text-dark">{formatTime(order.event_time)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/30">
            <h3 className="text-xs text-dark-light uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Entrega
            </h3>
            <div className="space-y-2.5">
              <div className="flex justify-between">
                <span className="text-sm text-dark-light">Tipo</span>
                <span className="text-sm font-medium text-dark">
                  {order.delivery_type === 'pickup' ? 'Retiro en local' : 'Delivery'}
                </span>
              </div>
              {order.delivery_address && (
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-dark-light flex-shrink-0">Direccion</span>
                  <span className="text-sm font-medium text-dark text-right">{order.delivery_address}</span>
                </div>
              )}
              {order.delivery_city && (
                <div className="flex justify-between">
                  <span className="text-sm text-dark-light">Ciudad</span>
                  <span className="text-sm font-medium text-dark">{order.delivery_city}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div data-animate className="bg-white rounded-2xl p-5 shadow-sm border border-border/30 mb-4">
          <h3 className="text-xs text-dark-light uppercase tracking-wider font-semibold mb-4 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Detalle del Pedido
          </h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0 last:pb-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-dark">{item.product_name || 'Producto'}</p>
                  <p className="text-xs text-dark-light mt-0.5">
                    {item.quantity > 1 && `x${item.quantity}`}
                    {item.portions && ` · ${item.portions} porciones`}
                  </p>
                </div>
                <span className="text-sm font-semibold text-dark ml-4">{formatCurrency(item.total_price)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-light">Descuento</span>
                <span className="text-success-dark font-medium">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-light">Envio</span>
                <span className="text-dark">{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-dark">Total</span>
              <span className="text-xl font-bold text-accent font-display">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div data-animate className="bg-white rounded-2xl p-5 shadow-sm border border-border/30 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs text-dark-light uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Pago
            </h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${paymentConfig.color} ${paymentConfig.bgColor}`}>
              {paymentConfig.label}
            </span>
          </div>

          <div className="space-y-2">
            {totalPaid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-light">Pagado</span>
                <span className="text-success-dark font-medium">{formatCurrency(totalPaid)}</span>
              </div>
            )}
            {remaining > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-light">Saldo pendiente</span>
                <span className="text-warning font-medium">{formatCurrency(remaining)}</span>
              </div>
            )}
          </div>

          {/* Payment progress bar */}
          {parseFloat(String(order.total)) > 0 && (
            <div className="mt-3">
              <div className="h-2 bg-border/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalPaid / parseFloat(String(order.total))) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-dark-light mt-1.5">
                {Math.round((totalPaid / parseFloat(String(order.total))) * 100)}% pagado
              </p>
            </div>
          )}
        </div>

        {/* Activity History */}
        {order.history.length > 0 && (
          <div data-animate className="bg-white rounded-2xl p-5 shadow-sm border border-border/30 mb-4">
            <h3 className="text-xs text-dark-light uppercase tracking-wider font-semibold mb-4 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Historial
            </h3>
            <div className="space-y-0">
              {order.history.map((entry, i) => {
                const entryConfig = STATUS_CONFIG[entry.new_status] || STATUS_CONFIG.pending
                return (
                  <div key={entry.id} className="flex gap-3">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${i === 0 ? 'bg-primary' : 'bg-border'}`} />
                      {i < order.history.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border/50 my-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className={`pb-4 ${i === order.history.length - 1 ? 'pb-0' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${i === 0 ? 'text-dark' : 'text-dark-light'}`}>
                          {entryConfig.label}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-dark-light mt-0.5">{entry.notes}</p>
                      )}
                      <p className="text-[11px] text-dark-light/70 mt-1">
                        {formatDate(entry.created_at, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Help / WhatsApp CTA */}
        <div data-animate className="bg-gradient-to-r from-primary/8 to-accent/8 rounded-2xl p-5 border border-primary/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold text-dark mb-1">Tienes alguna pregunta?</h3>
              <p className="text-sm text-dark-light">Escribenos y te ayudamos con gusto</p>
            </div>
            <a
              href={`https://wa.me/56939282764?text=${encodeURIComponent(`Hola! Consulto por mi pedido ${order.order_number}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-full font-semibold text-sm hover:bg-[#20bd5a] transition-colors shadow-sm flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
