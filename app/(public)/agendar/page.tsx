'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/stores/bookingStore'
import { BookingCalendar } from '@/components/public/BookingCalendar'
import { ProductSelector } from '@/components/public/ProductSelector'
import { EventTypeSelector } from '@/components/public/EventTypeSelector'
import { OrderSummaryFloat } from '@/components/public/OrderSummaryFloat'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency } from '@/lib/utils/format'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { cn } from '@/lib/utils/cn'
import type { ProductWithImages } from '@/types'

// Mock products con event_types
const allProducts: ProductWithImages[] = [
  {
    id: '1',
    category_id: '1',
    name: 'Torta de Chocolate',
    slug: 'torta-chocolate',
    description: 'Bizcocho de chocolate belga con ganache de chocolate semi-amargo',
    short_description: 'Chocolate belga premium con ganache',
    base_price: 180000,
    min_portions: 15,
    max_portions: 80,
    price_per_portion: 8000,
    preparation_days: 3,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: { event_types: ['bodas', 'cumpleanos', 'dias-especiales', 'corporativos', 'quinceaneras'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '2',
    category_id: '2',
    name: 'Torta Hojarasca',
    slug: 'torta-hojarasca',
    description: 'Capas de hojaldre crujiente con arequipe casero y merengue italiano',
    short_description: 'Hojaldre y arequipe artesanal',
    base_price: 160000,
    min_portions: 15,
    max_portions: 70,
    price_per_portion: 7500,
    preparation_days: 3,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: { event_types: ['bodas', 'cumpleanos', 'dias-especiales', 'baby-shower'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '3',
    category_id: '3',
    name: 'Torta Amor (Fresas con Crema)',
    slug: 'torta-amor',
    description: 'Clásica torta de fresas frescas con crema chantilly',
    short_description: 'Fresas frescas con crema chantilly',
    base_price: 150000,
    min_portions: 15,
    max_portions: 70,
    price_per_portion: 7000,
    preparation_days: 2,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: { event_types: ['cumpleanos', 'baby-shower', 'dias-especiales', 'quinceaneras'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '4',
    category_id: '4',
    name: 'Torta Tres Leches',
    slug: 'torta-tres-leches',
    description: 'Bizcocho empapado en mezcla de tres leches con crema batida',
    short_description: 'Suave y húmeda, un clásico irresistible',
    base_price: 140000,
    min_portions: 15,
    max_portions: 80,
    price_per_portion: 6500,
    preparation_days: 2,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: { event_types: ['cumpleanos', 'bautizos', 'primera-comunion', 'baby-shower', 'dias-especiales'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '5',
    category_id: '5',
    name: 'Torta Red Velvet',
    slug: 'torta-red-velvet',
    description: 'Bizcocho aterciopelado con frosting de queso crema',
    short_description: 'Suave textura con queso crema',
    base_price: 190000,
    min_portions: 15,
    max_portions: 100,
    price_per_portion: 8500,
    preparation_days: 3,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: { event_types: ['bodas', 'dias-especiales', 'quinceaneras', 'corporativos'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '6',
    category_id: '6',
    name: 'Torta de Vainilla',
    slug: 'torta-vainilla',
    description: 'Bizcocho de vainilla natural con buttercream suave',
    short_description: 'Clásica y versátil para cualquier evento',
    base_price: 130000,
    min_portions: 15,
    max_portions: 100,
    price_per_portion: 6000,
    preparation_days: 2,
    is_customizable: true,
    is_active: true,
    is_featured: false,
    metadata: { event_types: ['bodas', 'cumpleanos', 'bautizos', 'primera-comunion', 'baby-shower', 'quinceaneras'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
]

export default function AgendarPage() {
  const router = useRouter()
  const {
    bookingData,
    setEventType,
    setProduct,
    setEventDate,
    setEventTime,
    setDeliveryType,
    setPortions,
    setCustomizations,
    setCustomer,
  } = useBookingStore()

  // Filtrar productos según tipo de evento
  const filteredProducts = useMemo(() => {
    if (!bookingData.eventType) return []

    return allProducts.filter((product) => {
      const productEventTypes = product.metadata?.event_types as string[] || []
      return productEventTypes.includes(bookingData.eventType!)
    })
  }, [bookingData.eventType])

  // Calcular progreso
  const progress = useMemo(() => {
    let completed = 0
    const total = 7

    if (bookingData.eventType) completed++
    if (bookingData.product) completed++
    if (bookingData.eventDate) completed++
    if (bookingData.portions >= (bookingData.product?.min_portions || 0)) completed++
    if (bookingData.deliveryType !== null) completed++
    if (bookingData.customer.firstName && bookingData.customer.email && bookingData.customer.phone) completed++
    if (bookingData.deliveryType === 'pickup' || (bookingData.customer.address && bookingData.customer.city)) completed++

    return Math.round((completed / total) * 100)
  }, [bookingData])

  // Determinar qué secciones están habilitadas
  const isProductEnabled = !!bookingData.eventType
  const isDateEnabled = !!bookingData.product
  const isPortionsEnabled = !!bookingData.eventDate
  const isCustomizationEnabled = isPortionsEnabled && bookingData.portions >= (bookingData.product?.min_portions || 0)
  const isDeliveryEnabled = isCustomizationEnabled
  const isContactEnabled = isDeliveryEnabled

  const canSubmit = progress === 100

  const handleSubmit = () => {
    if (canSubmit) {
      router.push('/agendar/confirmacion')
    }
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-secondary to-accent/10 py-16 md:py-20 overflow-hidden">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary/30 rounded-full" />
            <div className="absolute top-20 right-20 w-32 h-32 border-2 border-accent/30 rounded-full" />
            <div className="absolute bottom-20 left-1/4 w-24 h-24 border-2 border-primary/30 rounded-full" />
            <div className="absolute bottom-10 right-1/3 w-16 h-16 border-2 border-accent/30 rounded-full" />
          </div>
        </div>

        {/* Gradient Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/15 rounded-full blur-2xl" />
        </div>

        <div className="relative container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-primary font-medium mb-6 shadow-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              Pedidos personalizados
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-dark mb-6">
              Haz tu <span className="text-primary">Pedido</span>
            </h1>
            <p className="text-lg md:text-xl text-dark-light leading-relaxed max-w-2xl mx-auto">
              Completa los datos paso a paso y crea la torta perfecta para tu evento especial
            </p>

            {/* Progress Indicator */}
            <div className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  progress > 0 ? "bg-primary text-white" : "bg-dark/10 text-dark-light"
                )}>
                  {progress > 0 ? '✓' : '1'}
                </div>
                <div className={cn("h-1 w-8 rounded-full transition-colors", progress >= 33 ? "bg-primary" : "bg-dark/10")} />
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  progress >= 33 ? "bg-primary text-white" : "bg-dark/10 text-dark-light"
                )}>
                  {progress >= 33 ? '✓' : '2'}
                </div>
                <div className={cn("h-1 w-8 rounded-full transition-colors", progress >= 66 ? "bg-primary" : "bg-dark/10")} />
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  progress >= 66 ? "bg-primary text-white" : "bg-dark/10 text-dark-light"
                )}>
                  {progress >= 66 ? '✓' : '3'}
                </div>
              </div>
              <span className="text-sm font-medium text-dark-light ml-2">{progress}% completado</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Progress Stepper */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {/* Paso 1: Tipo de Evento */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 mb-2',
                  bookingData.eventType
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-dark/10 text-dark-light'
                )}
              >
                {bookingData.eventType ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  '1'
                )}
              </div>
              <p className={cn('text-xs font-medium text-center', bookingData.eventType ? 'text-dark' : 'text-dark-light')}>
                Tipo de Evento
              </p>
            </div>
            <div className={cn('h-0.5 flex-1 transition-all duration-300', bookingData.eventType ? 'bg-primary' : 'bg-dark/10')} />

            {/* Paso 2: Producto */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 mb-2',
                  bookingData.product
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-dark/10 text-dark-light'
                )}
              >
                {bookingData.product ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  '2'
                )}
              </div>
              <p className={cn('text-xs font-medium text-center', bookingData.product ? 'text-dark' : 'text-dark-light')}>
                Producto
              </p>
            </div>
            <div className={cn('h-0.5 flex-1 transition-all duration-300', bookingData.product ? 'bg-primary' : 'bg-dark/10')} />

            {/* Paso 3: Fecha */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 mb-2',
                  bookingData.eventDate
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-dark/10 text-dark-light'
                )}
              >
                {bookingData.eventDate ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  '3'
                )}
              </div>
              <p className={cn('text-xs font-medium text-center', bookingData.eventDate ? 'text-dark' : 'text-dark-light')}>
                Fecha
              </p>
            </div>
            <div className={cn('h-0.5 flex-1 transition-all duration-300', bookingData.eventDate ? 'bg-primary' : 'bg-dark/10')} />

            {/* Paso 4: Detalles */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 mb-2',
                  bookingData.portions >= (bookingData.product?.min_portions || 0) && bookingData.deliveryType !== null
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-dark/10 text-dark-light'
                )}
              >
                {bookingData.portions >= (bookingData.product?.min_portions || 0) && bookingData.deliveryType !== null ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  '4'
                )}
              </div>
              <p className={cn('text-xs font-medium text-center', bookingData.portions >= (bookingData.product?.min_portions || 0) && bookingData.deliveryType !== null ? 'text-dark' : 'text-dark-light')}>
                Detalles
              </p>
            </div>
            <div className={cn('h-0.5 flex-1 transition-all duration-300', bookingData.portions >= (bookingData.product?.min_portions || 0) && bookingData.deliveryType !== null ? 'bg-primary' : 'bg-dark/10')} />

            {/* Paso 5: Contacto */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 mb-2',
                  bookingData.customer.firstName && bookingData.customer.email && bookingData.customer.phone
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-dark/10 text-dark-light'
                )}
              >
                {bookingData.customer.firstName && bookingData.customer.email && bookingData.customer.phone ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  '5'
                )}
              </div>
              <p className={cn('text-xs font-medium text-center', bookingData.customer.firstName && bookingData.customer.email && bookingData.customer.phone ? 'text-dark' : 'text-dark-light')}>
                Contacto
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* 1. Tipo de Evento */}
          <Card className="relative">
            <div className="absolute -left-4 -top-4 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
              1
            </div>
            <h2 className="font-display text-2xl font-bold text-dark mb-2">
              ¿Para qué tipo de evento es?
            </h2>
            <p className="text-dark-light mb-6">Selecciona el tipo de evento para ver sabores recomendados</p>
            <EventTypeSelector
              selectedEventType={bookingData.eventType}
              onSelectEventType={setEventType}
            />
          </Card>

          {/* 2. Seleccionar Producto */}
          <Card className={cn('relative', !isProductEnabled && 'opacity-50 pointer-events-none')}>
            <div className={cn(
              'absolute -left-4 -top-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg',
              isProductEnabled ? 'bg-primary text-white' : 'bg-dark/20 text-dark-light'
            )}>
              2
            </div>
            <h2 className="font-display text-2xl font-bold text-dark mb-2">
              Selecciona tu Producto
            </h2>
            <p className="text-dark-light mb-6">
              {isProductEnabled
                ? `${filteredProducts.length} productos disponibles para tu evento`
                : 'Primero selecciona el tipo de evento'}
            </p>
            {isProductEnabled && (
              <ProductSelector
                products={filteredProducts}
                selectedProduct={bookingData.product}
                onSelectProduct={setProduct}
              />
            )}
          </Card>

          {/* 3. Fecha del Evento */}
          <Card className={cn('relative', !isDateEnabled && 'opacity-50 pointer-events-none')}>
            <div className={cn(
              'absolute -left-4 -top-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg',
              isDateEnabled ? 'bg-primary text-white' : 'bg-dark/20 text-dark-light'
            )}>
              3
            </div>
            <h2 className="font-display text-2xl font-bold text-dark mb-2">
              ¿Cuándo es tu evento?
            </h2>
            <p className="text-dark-light mb-6">
              {isDateEnabled
                ? 'Selecciona la fecha de tu evento'
                : 'Primero selecciona el producto para tu evento'}
            </p>
            {isDateEnabled && (
              <div className="grid md:grid-cols-2 gap-6">
                <BookingCalendar
                  selectedDate={bookingData.eventDate}
                  onSelectDate={setEventDate}
                />
                {bookingData.eventDate && (
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Horario del evento (opcional)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setEventTime('AM')}
                        className={cn(
                          'p-4 rounded-lg border-2 transition-all duration-200',
                          bookingData.eventTime === 'AM'
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className="text-2xl mb-1">☀️</div>
                        <p className="font-semibold text-dark">Mañana</p>
                        <p className="text-xs text-dark-light">AM</p>
                      </button>
                      <button
                        onClick={() => setEventTime('PM')}
                        className={cn(
                          'p-4 rounded-lg border-2 transition-all duration-200',
                          bookingData.eventTime === 'PM'
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className="text-2xl mb-1">🌙</div>
                        <p className="font-semibold text-dark">Tarde/Noche</p>
                        <p className="text-xs text-dark-light">PM</p>
                      </button>
                    </div>
                    <p className="text-xs text-dark-light mt-2">
                      Esto nos ayuda a coordinar mejor la entrega
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* 4. Porciones */}
          <Card className={cn('relative', !isPortionsEnabled && 'opacity-50 pointer-events-none')}>
            <div className={cn(
              'absolute -left-4 -top-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg',
              isPortionsEnabled ? 'bg-primary text-white' : 'bg-dark/20 text-dark-light'
            )}>
              4
            </div>
            <h2 className="font-display text-2xl font-bold text-dark mb-2">
              ¿Cuántas porciones necesitas?
            </h2>
            <p className="text-dark-light mb-6">
              {isPortionsEnabled
                ? `Mínimo ${bookingData.product?.min_portions} - Máximo ${bookingData.product?.max_portions} porciones`
                : 'Primero selecciona la fecha del evento'}
            </p>
            {isPortionsEnabled && bookingData.product && (
              <div className="flex items-center justify-center gap-6">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() =>
                    setPortions(Math.max(bookingData.product!.min_portions, bookingData.portions - 5))
                  }
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </Button>
                <div className="text-center min-w-[150px]">
                  <span className="text-5xl font-bold text-dark block">{bookingData.portions}</span>
                  <p className="text-dark-light mt-2">porciones</p>
                </div>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() =>
                    setPortions(Math.min(bookingData.product!.max_portions, bookingData.portions + 5))
                  }
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Button>
              </div>
            )}
          </Card>

          {/* 5. Personalización */}
          <Card className={cn('relative', !isCustomizationEnabled && 'opacity-50 pointer-events-none')}>
            <div className={cn(
              'absolute -left-4 -top-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg',
              isCustomizationEnabled ? 'bg-primary text-white' : 'bg-dark/20 text-dark-light'
            )}>
              5
            </div>
            <h2 className="font-display text-2xl font-bold text-dark mb-2">
              Personaliza tu torta
            </h2>
            <p className="text-dark-light mb-6">Mensaje y detalles especiales</p>
            {isCustomizationEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    Mensaje en la torta (opcional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Ej: Feliz Cumpleaños María"
                    value={bookingData.customizations.message || ''}
                    onChange={(e) => setCustomizations({ message: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    Solicitudes especiales (opcional)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    rows={4}
                    placeholder="Alergias, preferencias de decoración, etc."
                    value={bookingData.customizations.specialRequests || ''}
                    onChange={(e) => setCustomizations({ specialRequests: e.target.value })}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* 6. Tipo de Entrega */}
          <Card className={cn('relative', !isDeliveryEnabled && 'opacity-50 pointer-events-none')}>
            <div className={cn(
              'absolute -left-4 -top-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg',
              isDeliveryEnabled ? 'bg-primary text-white' : 'bg-dark/20 text-dark-light'
            )}>
              6
            </div>
            <h2 className="font-display text-2xl font-bold text-dark mb-2">
              ¿Cómo quieres recibir tu torta?
            </h2>
            <p className="text-dark-light mb-6">Selecciona el método de entrega</p>
            {isDeliveryEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeliveryType('pickup')}
                  className={cn(
                    'p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105',
                    bookingData.deliveryType === 'pickup'
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="text-4xl mb-3">🏪</div>
                  <p className="font-semibold text-dark mb-1">Recoger en tienda</p>
                  <p className="text-sm text-dark-light">Sin costo adicional</p>
                </button>
                <button
                  onClick={() => setDeliveryType('delivery')}
                  className={cn(
                    'p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105',
                    bookingData.deliveryType === 'delivery'
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="text-4xl mb-3">🚗</div>
                  <p className="font-semibold text-dark mb-1">Entrega a domicilio</p>
                  <p className="text-sm text-dark-light">+{formatCurrency(15000)}</p>
                </button>
              </div>
            )}
          </Card>

          {/* 7. Información de Contacto */}
          <Card className={cn('relative', !isContactEnabled && 'opacity-50 pointer-events-none')}>
            <div className={cn(
              'absolute -left-4 -top-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg',
              isContactEnabled ? 'bg-primary text-white' : 'bg-dark/20 text-dark-light'
            )}>
              7
            </div>
            <h2 className="font-display text-2xl font-bold text-dark mb-2">
              Información de Contacto
            </h2>
            <p className="text-dark-light mb-6">Para confirmar y coordinar tu pedido</p>
            {isContactEnabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">Nombre *</label>
                    <Input
                      type="text"
                      placeholder="Tu nombre"
                      value={bookingData.customer.firstName}
                      onChange={(e) => setCustomer({ firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">Apellido *</label>
                    <Input
                      type="text"
                      placeholder="Tu apellido"
                      value={bookingData.customer.lastName}
                      onChange={(e) => setCustomer({ lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Email *</label>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={bookingData.customer.email}
                    onChange={(e) => setCustomer({ email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Teléfono/WhatsApp *</label>
                  <Input
                    type="tel"
                    placeholder="+57 300 123 4567"
                    value={bookingData.customer.phone}
                    onChange={(e) => setCustomer({ phone: e.target.value })}
                  />
                </div>

                {bookingData.deliveryType === 'delivery' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">Dirección *</label>
                      <Input
                        type="text"
                        placeholder="Calle, número, apartamento"
                        value={bookingData.customer.address || ''}
                        onChange={(e) => setCustomer({ address: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">Ciudad *</label>
                      <Input
                        type="text"
                        placeholder="Tu ciudad"
                        value={bookingData.customer.city || ''}
                        onChange={(e) => setCustomer({ city: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>

          {/* Resumen en Mobile */}
          {bookingData.product && (
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 lg:hidden">
              <h3 className="font-display text-2xl font-bold text-dark mb-4">Resumen del Pedido</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-dark-light">
                  <span>Subtotal ({bookingData.portions} porciones)</span>
                  <span className="font-semibold">{formatCurrency(bookingData.subtotal)}</span>
                </div>
                {bookingData.deliveryFee > 0 && (
                  <div className="flex justify-between text-dark-light">
                    <span>Envío</span>
                    <span className="font-semibold">{formatCurrency(bookingData.deliveryFee)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-primary/20 flex justify-between items-center">
                  <span className="text-xl font-bold text-dark">Total</span>
                  <span className="text-3xl font-bold text-accent font-display">
                    {formatCurrency(bookingData.total)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Submit Button */}
          <div className="text-center pt-6">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-12"
            >
              {canSubmit ? 'Confirmar Pedido →' : 'Completa todos los campos'}
            </Button>
            {!canSubmit && (
              <p className="text-sm text-dark-light mt-3">
                Completa toda la información para continuar
              </p>
            )}
          </div>
        </div>
      </div>

      <WhatsAppButton />
      <OrderSummaryFloat />
    </>
  )
}
