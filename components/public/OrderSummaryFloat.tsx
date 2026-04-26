'use client'

import { Card } from '@/components/ui'
import { formatCurrency } from '@/lib/utils/format'
import { useBookingStore } from '@/stores/bookingStore'
import { useEffect, useState } from 'react'

export function OrderSummaryFloat() {
  const { bookingData } = useBookingStore()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Mostrar el flotante solo si hay un producto seleccionado
    setIsVisible(!!bookingData.product)
  }, [bookingData.product])

  if (!isVisible || !bookingData.product) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 animate-slide-up hidden lg:block">
      <Card className="bg-gradient-to-br from-white to-secondary shadow-2xl border-2 border-primary/20">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-dark-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.701 2.701 0 001 15.546M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-dark text-sm line-clamp-1">
              {bookingData.product.name}
            </h3>
            <p className="text-xs text-dark-light">
              {bookingData.portions} porciones
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-dark-light">Subtotal</span>
            <span className="font-semibold text-dark">
              {formatCurrency(bookingData.subtotal)}
            </span>
          </div>

          {bookingData.deliveryFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-dark-light">Envío</span>
              <span className="font-semibold text-dark">
                {formatCurrency(bookingData.deliveryFee)}
              </span>
            </div>
          )}

          <div className="pt-3 mt-3 border-t border-border flex justify-between items-center">
            <span className="font-bold text-dark">Total</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-accent font-display block">
                {formatCurrency(bookingData.total)}
              </span>
              {bookingData.product.price_per_portion && (
                <span className="text-xs text-dark-light">
                  {formatCurrency(bookingData.product.price_per_portion)}/porción
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Detalles adicionales */}
        {bookingData.eventDate && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-dark-light">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>
                {new Intl.DateTimeFormat('es-CO', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date(bookingData.eventDate))}
              </span>
            </div>
          </div>
        )}

        {/* Indicador de descuento futuro (opcional) */}
        {bookingData.portions >= 50 && (
          <div className="mt-3 p-2 bg-success/10 rounded-lg text-center">
            <p className="text-xs text-success-dark font-medium">
              Pedido grande — Precio especial aplicado
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
