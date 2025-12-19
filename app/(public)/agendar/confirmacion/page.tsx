'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBookingStore } from '@/stores/bookingStore'
import { Button, Card } from '@/components/ui'
import { formatCurrency } from '@/lib/utils/format'

export default function ConfirmacionPage() {
  const router = useRouter()
  const { bookingData, resetBooking } = useBookingStore()
  const [orderNumber, setOrderNumber] = useState<string>('')

  useEffect(() => {
    // Verificar que hay datos de booking
    if (!bookingData.product || !bookingData.eventDate) {
      router.push('/agendar')
      return
    }

    // Generar número de orden
    const number = `ORD-${Date.now().toString().slice(-8)}`
    setOrderNumber(number)
  }, [bookingData, router])

  const handleFinish = () => {
    resetBooking()
    router.push('/')
  }

  if (!bookingData.product) return null

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="inline-block p-6 bg-primary/10 rounded-full mb-4 animate-bounce">
              <svg
                className="w-16 h-16 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-dark mb-3">
              ¡Pedido Confirmado!
            </h1>
            <p className="text-xl text-dark-light">
              Hemos recibido tu pedido correctamente
            </p>
          </div>

          {/* Order Number */}
          <Card className="mb-6 bg-primary text-white text-center">
            <p className="text-sm opacity-90 mb-1">Número de pedido</p>
            <p className="text-3xl font-bold font-display">{orderNumber}</p>
          </Card>

          {/* Order Details */}
          <Card className="mb-6">
            <h2 className="font-display text-2xl font-bold text-dark mb-6">
              Resumen del Pedido
            </h2>

            <div className="space-y-4">
              {/* Producto */}
              <div className="flex items-start gap-4 pb-4 border-b border-border">
                <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">🎂</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-dark">
                    {bookingData.product.name}
                  </h3>
                  <p className="text-sm text-dark-light mb-2">
                    {bookingData.portions} porciones
                  </p>
                  {bookingData.customizations.message && (
                    <p className="text-sm text-dark-light">
                      <span className="font-medium">Mensaje:</span>{' '}
                      "{bookingData.customizations.message}"
                    </p>
                  )}
                </div>
              </div>

              {/* Fecha y hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-dark-light mb-1">
                    Fecha del evento
                  </p>
                  <p className="text-dark font-semibold">
                    {formatDate(bookingData.eventDate!)}
                  </p>
                  {bookingData.eventTime && (
                    <p className="text-sm text-dark-light">
                      {bookingData.eventTime}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-dark-light mb-1">
                    Tipo de entrega
                  </p>
                  <p className="text-dark font-semibold">
                    {bookingData.deliveryType === 'pickup'
                      ? '🏪 Recoger en tienda'
                      : '🚗 Entrega a domicilio'}
                  </p>
                </div>
              </div>

              {/* Cliente */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium text-dark-light mb-2">
                  Información de contacto
                </p>
                <div className="space-y-1 text-dark">
                  <p>
                    {bookingData.customer.firstName} {bookingData.customer.lastName}
                  </p>
                  <p className="text-sm text-dark-light">
                    {bookingData.customer.email}
                  </p>
                  <p className="text-sm text-dark-light">
                    {bookingData.customer.phone}
                  </p>
                  {bookingData.customer.address && (
                    <p className="text-sm text-dark-light">
                      {bookingData.customer.address}, {bookingData.customer.city}
                    </p>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-dark">Total</span>
                  <span className="text-3xl font-bold text-accent font-display">
                    {formatCurrency(bookingData.total)}
                  </span>
                </div>
                {bookingData.deliveryFee > 0 && (
                  <p className="text-sm text-dark-light mt-1">
                    Incluye {formatCurrency(bookingData.deliveryFee)} de envío
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          <Card className="mb-6 bg-secondary/50">
            <h3 className="font-semibold text-dark mb-4">
              ¿Qué sigue ahora?
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <p className="text-dark-light">
                  Recibirás un <span className="text-dark font-medium">email de confirmación</span> con
                  todos los detalles de tu pedido
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <p className="text-dark-light">
                  Nuestro equipo te contactará por <span className="text-dark font-medium">WhatsApp</span> para
                  confirmar los detalles y coordinar el pago
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <p className="text-dark-light">
                  Te mantendremos informado sobre el <span className="text-dark font-medium">estado de tu pedido</span> hasta
                  el día de la entrega
                </p>
              </div>
            </div>
          </Card>

          {/* Métodos de pago */}
          <Card className="mb-8">
            <h3 className="font-semibold text-dark mb-4">
              Métodos de pago disponibles
            </h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
                <span className="text-2xl">💳</span>
                <span className="text-sm text-dark">Tarjetas</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
                <span className="text-2xl">💰</span>
                <span className="text-sm text-dark">Efectivo</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
                <span className="text-2xl">📱</span>
                <span className="text-sm text-dark">Transferencia</span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleFinish} size="lg">
              Volver al Inicio
            </Button>
            <Link href="/catalogo">
              <Button variant="secondary" size="lg">
                Ver Catálogo
              </Button>
            </Link>
          </div>

          {/* Contact Info */}
          <div className="text-center mt-8 p-6 bg-white rounded-2xl shadow-sm">
            <p className="text-dark-light mb-2">
              ¿Tienes alguna pregunta sobre tu pedido?
            </p>
            <a
              href="https://wa.me/573001234567"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary-hover transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contáctanos por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
