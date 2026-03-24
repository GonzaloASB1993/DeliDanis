'use client'

import { useState, useMemo, useEffect } from 'react'
import { useBookingStoreMulti } from '@/stores/bookingStoreMulti'
import { getCakeProducts, getCocktailProducts, getPastryProducts } from '@/lib/supabase/product-queries'
import { ServiceCategorySelector } from '@/components/public/ServiceCategorySelector'
import { ServiceCart } from '@/components/public/ServiceCart'
import { TortaServiceForm } from '@/components/public/TortaServiceForm'
import { CocktailServiceForm } from '@/components/public/CocktailServiceForm'
import { PastryServiceForm } from '@/components/public/PastryServiceForm'
import { EventTypeSelector } from '@/components/public/EventTypeSelector'
import { BookingCalendar } from '@/components/public/BookingCalendar'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency } from '@/lib/utils/format'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { cn } from '@/lib/utils/cn'
import type { ProductWithImages } from '@/types'
import type { ServiceType } from '@/stores/bookingStoreMulti'
import {
  validateEmail,
  validatePhone,
  validateName,
  validateAddress,
  validateCity,
} from '@/lib/utils/validation'
import { createBooking } from '@/lib/supabase/booking-mutations'

export default function AgendarPage() {
  const {
    bookingData,
    currentStep,
    setEventType,
    setEventDate,
    setEventTime,
    setDeliveryType,
    setCustomer,
    addService,
    removeService,
    nextStep,
    prevStep,
    resetBooking,
  } = useBookingStoreMulti()

  // Local state for modal/forms
  const [showServiceSelector, setShowServiceSelector] = useState(false)
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null)
  const [showServiceForm, setShowServiceForm] = useState(false)

  // Estado para validación de formulario
  const [formErrors, setFormErrors] = useState<{
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
    city?: string
  }>({})

  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [depositPercentage, setDepositPercentage] = useState(50)

  const [deliveryCost, setDeliveryCost] = useState(15000) // fallback to default

  useEffect(() => {
    import('@/lib/supabase/client').then(({ supabase }) => {
      supabase
        .from('settings')
        .select('value')
        .eq('key', 'payments')
        .single()
        .then(({ data }) => {
          if (typeof data?.value?.delivery_cost === 'number') {
            setDeliveryCost(data.value.delivery_cost)
          }
        })
    })
  }, [])

  // Estado para productos cargados desde BD
  const [cakeProducts, setCakeProducts] = useState<ProductWithImages[]>([])
  const [cocktailProducts, setCocktailProducts] = useState<any[]>([])
  const [pastryProducts, setPastryProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)

  // Cargar productos desde la base de datos
  useEffect(() => {
    async function loadProducts() {
      try {
        setIsLoadingProducts(true)

        // Cargar todos los productos en paralelo
        const [cakeResult, cocktailResult, pastryResult] = await Promise.all([
          getCakeProducts(),
          getCocktailProducts(),
          getPastryProducts(),
        ])

        if (cakeResult.success) {
          setCakeProducts(cakeResult.products)
        }

        if (cocktailResult.success) {
          setCocktailProducts(cocktailResult.products)
        }

        if (pastryResult.success) {
          setPastryProducts(pastryResult.products)
        }

        // Si ninguno cargó correctamente, mostrar error
        if (!cakeResult.success && !cocktailResult.success && !pastryResult.success) {
          setProductsError('No se pudieron cargar los productos')
        }
      } catch (error) {
        console.error('Error loading products:', error)
        setProductsError('Error al cargar los productos')
      } finally {
        setIsLoadingProducts(false)
      }
    }

    loadProducts()
  }, [])

  // Handler: select service category
  const handleSelectCategory = (type: ServiceType) => {
    setSelectedServiceType(type)
    setShowServiceSelector(false)
    setShowServiceForm(true)
  }

  // Handler: add service and reset form
  const handleAddService = (service: any) => {
    addService(service)
    setShowServiceForm(false)
    setSelectedServiceType(null)
  }

  // Handler: cancel service form
  const handleCancelServiceForm = () => {
    setShowServiceForm(false)
    setSelectedServiceType(null)
  }

  // Validar todo el formulario del paso 4
  const validateContactForm = (): boolean => {
    const errors: typeof formErrors = {}

    // Validar nombre
    const firstNameValidation = validateName(bookingData.customer.firstName, 'nombre')
    if (!firstNameValidation.isValid) {
      errors.firstName = firstNameValidation.error
    }

    // Validar apellido
    const lastNameValidation = validateName(bookingData.customer.lastName, 'apellido')
    if (!lastNameValidation.isValid) {
      errors.lastName = lastNameValidation.error
    }

    // Validar email
    const emailValidation = validateEmail(bookingData.customer.email)
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error
    }

    // Validar teléfono
    const phoneValidation = validatePhone(bookingData.customer.phone)
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error
    }

    // Validar dirección y ciudad solo si es delivery
    if (bookingData.deliveryType === 'delivery') {
      const addressValidation = validateAddress(bookingData.customer.address || '')
      if (!addressValidation.isValid) {
        errors.address = addressValidation.error
      }

      const cityValidation = validateCity(bookingData.customer.city || '')
      if (!cityValidation.isValid) {
        errors.city = cityValidation.error
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Limpiar error cuando el usuario comience a escribir
  const handleInputChange = (field: keyof typeof formErrors, value: string) => {
    setCustomer({ [field]: value })

    // Limpiar error del campo (eliminar la key, no setear undefined)
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // Validar campo al perder foco (onBlur)
  const handleInputBlur = (field: keyof typeof formErrors) => {
    let errorMsg: string | undefined

    switch (field) {
      case 'firstName': {
        const v = validateName(bookingData.customer.firstName, 'nombre')
        if (!v.isValid) errorMsg = v.error
        break
      }
      case 'lastName': {
        const v = validateName(bookingData.customer.lastName, 'apellido')
        if (!v.isValid) errorMsg = v.error
        break
      }
      case 'email': {
        const v = validateEmail(bookingData.customer.email)
        if (!v.isValid) errorMsg = v.error
        break
      }
      case 'phone': {
        const v = validatePhone(bookingData.customer.phone)
        if (!v.isValid) errorMsg = v.error
        break
      }
      case 'address': {
        if (bookingData.deliveryType === 'delivery') {
          const v = validateAddress(bookingData.customer.address || '')
          if (!v.isValid) errorMsg = v.error
        }
        break
      }
      case 'city': {
        if (bookingData.deliveryType === 'delivery') {
          const v = validateCity(bookingData.customer.city || '')
          if (!v.isValid) errorMsg = v.error
        }
        break
      }
    }

    setFormErrors((prev) => {
      const next = { ...prev }
      if (errorMsg) {
        next[field] = errorMsg
      } else {
        delete next[field]
      }
      return next
    })
  }

  // Handler: add another service
  const handleAddAnother = () => {
    setShowServiceSelector(true)
  }

  // Handler: continue to next step
  const handleContinueToCheckout = () => {
    nextStep()
  }

  // Validation functions
  const canContinueStep1 = bookingData.eventType !== null
  const canContinueStep2 = bookingData.services.length > 0
  const canContinueStep3 =
    bookingData.eventDate !== null &&
    bookingData.eventTime !== null &&
    bookingData.deliveryType !== null
  const canContinueStep4 = useMemo(() => {
    // Verificar que todos los campos requeridos tengan valor
    const hasRequiredFields =
      bookingData.customer.firstName.trim() !== '' &&
      bookingData.customer.lastName.trim() !== '' &&
      bookingData.customer.email.trim() !== '' &&
      bookingData.customer.phone.trim() !== ''

    // Si es delivery, verificar dirección y ciudad
    const hasDeliveryFields =
      bookingData.deliveryType === 'pickup' ||
      (bookingData.customer.address?.trim() !== '' &&
        bookingData.customer.city?.trim() !== '')

    // No debe haber errores de validación activos
    const hasNoErrors = Object.values(formErrors).filter(Boolean).length === 0

    return hasRequiredFields && hasDeliveryFields && hasNoErrors
  }, [bookingData.customer, bookingData.deliveryType, formErrors])

  const handlePay = async (paymentType: 'deposit' | 'full') => {
    setIsPaymentLoading(true)
    setPaymentError(null)

    try {
      // 1. Crear el pedido con status pending_payment
      const result = await createBooking(bookingData)

      if (!result.success || !result.orderId) {
        setPaymentError(result.error || 'Error al registrar el pedido')
        setIsPaymentLoading(false)
        return
      }

      // 2. Crear preferencia de pago en MP
      const prefResponse = await fetch('/api/payments/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: result.orderId, paymentType }),
      })

      const prefData = await prefResponse.json()

      if (!prefResponse.ok || !prefData.initPoint) {
        setPaymentError('Error al iniciar el pago. Intenta nuevamente.')
        setIsPaymentLoading(false)
        return
      }

      // Actualizar el porcentaje mostrado si viene diferente al default
      if (prefData.depositPercentage) {
        setDepositPercentage(prefData.depositPercentage)
      }

      // 3. Redirigir a MercadoPago
      window.location.href = prefData.initPoint
    } catch {
      setPaymentError('Error inesperado. Por favor intenta nuevamente.')
      setIsPaymentLoading(false)
    }
  }

  // Progress percentage
  const progressPercentage = (currentStep / 5) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-white to-primary/5 py-12">
      <div className="container mx-auto px-4">
        {/* Progress Bar - Aligned with content */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="lg:pr-[420px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-dark">Paso {currentStep} de 5</span>
              <span className="text-sm text-dark-light font-medium">{Math.round(progressPercentage)}% completado</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-primary via-primary-hover to-accent transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Step Labels */}
            <div className="grid grid-cols-5 gap-3 mt-5">
              {[
                { num: 1, label: 'Evento', icon: '🎊' },
                { num: 2, label: 'Servicios', icon: '🛍️' },
                { num: 3, label: 'Detalles', icon: '📋' },
                { num: 4, label: 'Contacto', icon: '📞' },
                { num: 5, label: 'Pago', icon: '💳' },
              ].map((step) => (
                <div
                  key={step.num}
                  className={cn(
                    'text-center py-3 px-4 rounded-xl transition-all duration-300 border-2',
                    currentStep === step.num
                      ? 'bg-primary border-primary text-white font-semibold shadow-lg scale-105'
                      : currentStep > step.num
                      ? 'bg-accent/10 border-accent text-accent font-medium'
                      : 'bg-white border-gray-200 text-gray-400'
                  )}
                >
                  <div className="text-lg mb-1">{step.icon}</div>
                  <div className="text-xs font-semibold">{step.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar Cart */}
        <div className="max-w-7xl mx-auto">
          {/* Header - Aligned with form content */}
          <div className="lg:pr-[420px] mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-dark mb-4">
              Arma Tu Evento Perfecto
            </h1>
            <p className="text-lg text-dark-light">
              Selecciona los servicios que necesitas para tu celebración. Puedes combinar tortas,
              coctelería y pastelería en un solo pedido.
            </p>
          </div>

          {/* Grid con formulario y cart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-7 xl:col-span-8">
            <Card className="p-6 md:p-8">
              {/* STEP 1: Event Type */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-dark mb-2">
                      ¿Para qué tipo de evento?
                    </h2>
                    <p className="text-dark-light">
                      Esto nos ayuda a recomendarte los mejores productos para tu celebración
                    </p>
                  </div>

                  <EventTypeSelector
                    selectedEventType={bookingData.eventType}
                    onSelectEventType={(slug) => setEventType(slug)}
                  />

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={nextStep}
                      disabled={!canContinueStep1}
                      className="px-8"
                    >
                      Continuar
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: Services */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-dark mb-2">
                      Selecciona Tus Servicios
                    </h2>
                    <p className="text-dark-light">
                      Agrega todos los servicios que necesites para tu evento
                    </p>
                  </div>

                  {/* Show Service Selector or Form */}
                  {!showServiceForm && (
                    <>
                      {showServiceSelector ? (
                        <ServiceCategorySelector
                          selectedCategory={selectedServiceType}
                          onSelectCategory={handleSelectCategory}
                        />
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">🎉</div>
                          <p className="text-dark-light mb-6">
                            {bookingData.services.length === 0
                              ? 'Comienza agregando tu primer servicio'
                              : `Tienes ${bookingData.services.length} ${
                                  bookingData.services.length === 1 ? 'servicio agregado' : 'servicios agregados'
                                }`}
                          </p>
                          <Button onClick={() => setShowServiceSelector(true)} variant="primary">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {bookingData.services.length === 0 ? 'Agregar Servicio' : 'Agregar Otro Servicio'}
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Service Forms */}
                  {showServiceForm && selectedServiceType === 'torta' && (
                    <>
                      {isLoadingProducts ? (
                        <Card className="p-8 text-center">
                          <div className="animate-pulse">
                            <div className="text-lg text-dark-light">Cargando productos...</div>
                          </div>
                        </Card>
                      ) : productsError ? (
                        <Card className="p-8 text-center">
                          <div className="text-red-600 mb-4">{productsError}</div>
                          <Button onClick={() => window.location.reload()}>
                            Reintentar
                          </Button>
                        </Card>
                      ) : (
                        <TortaServiceForm
                          eventType={bookingData.eventType || ''}
                          availableProducts={cakeProducts}
                          onAddService={handleAddService}
                          onCancel={handleCancelServiceForm}
                        />
                      )}
                    </>
                  )}

                  {showServiceForm && selectedServiceType === 'cocteleria' && (
                    <>
                      {isLoadingProducts ? (
                        <Card className="p-8 text-center">
                          <div className="animate-pulse">
                            <div className="text-lg text-dark-light">Cargando productos...</div>
                          </div>
                        </Card>
                      ) : (
                        <CocktailServiceForm
                          availableProducts={cocktailProducts}
                          onAddService={handleAddService}
                          onCancel={handleCancelServiceForm}
                        />
                      )}
                    </>
                  )}

                  {showServiceForm && selectedServiceType === 'pasteleria' && (
                    <>
                      {isLoadingProducts ? (
                        <Card className="p-8 text-center">
                          <div className="animate-pulse">
                            <div className="text-lg text-dark-light">Cargando productos...</div>
                          </div>
                        </Card>
                      ) : (
                        <PastryServiceForm
                          availableProducts={pastryProducts}
                          onAddService={handleAddService}
                          onCancel={handleCancelServiceForm}
                        />
                      )}
                    </>
                  )}

                  {/* Navigation Buttons */}
                  {!showServiceForm && !showServiceSelector && (
                    <div className="flex justify-between pt-4">
                      <Button onClick={prevStep} variant="ghost">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                        Atrás
                      </Button>
                      <Button onClick={nextStep} disabled={!canContinueStep2}>
                        Continuar
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Event Details & Delivery */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-dark mb-2">
                      Detalles del Evento
                    </h2>
                    <p className="text-dark-light">
                      Cuéntanos cuándo y dónde necesitas tu pedido
                    </p>
                  </div>

                  {/* Event Date */}
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-3">
                      Fecha del Evento *
                    </label>
                    <BookingCalendar
                      selectedDate={bookingData.eventDate}
                      onSelectDate={(date) => setEventDate(date)}
                    />
                  </div>

                  {/* Event Time */}
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-3">
                      Horario del Evento *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['AM', 'PM'].map((time) => (
                        <button
                          key={time}
                          onClick={() => setEventTime(time as 'AM' | 'PM')}
                          className={cn(
                            'py-4 px-6 rounded-xl border-2 font-semibold transition-all duration-200',
                            bookingData.eventTime === time
                              ? 'border-primary bg-primary text-white shadow-lg'
                              : 'border-border hover:border-primary/50 text-dark'
                          )}
                        >
                          {time === 'AM' ? 'Mañana (6:00 AM - 12:00 PM)' : 'Tarde (12:00 PM - 10:00 PM)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Type */}
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-3">
                      Tipo de Entrega *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => setDeliveryType('pickup')}
                        className={cn(
                          'py-6 px-6 rounded-xl border-2 transition-all duration-200 text-left',
                          bookingData.deliveryType === 'pickup'
                            ? 'border-primary bg-primary/10 shadow-lg'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className="text-3xl mb-2">🏪</div>
                        <div className="font-semibold text-dark mb-1">Recoger en Tienda</div>
                        <div className="text-sm text-dark-light">Sin costo adicional</div>
                      </button>
                      <button
                        onClick={() => setDeliveryType('delivery')}
                        className={cn(
                          'py-6 px-6 rounded-xl border-2 transition-all duration-200 text-left',
                          bookingData.deliveryType === 'delivery'
                            ? 'border-primary bg-primary/10 shadow-lg'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className="text-3xl mb-2">🚚</div>
                        <div className="font-semibold text-dark mb-1">Delivery</div>
                        <div className="text-sm text-accent font-semibold">+{formatCurrency(deliveryCost)}</div>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button onClick={prevStep} variant="ghost">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                      </svg>
                      Atrás
                    </Button>
                    <Button onClick={nextStep} disabled={!canContinueStep3}>
                      Continuar
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 4: Contact Information */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-dark mb-2">
                      Información de Contacto
                    </h2>
                    <p className="text-dark-light">
                      Para finalizar necesitamos tus datos de contacto
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nombre *"
                      value={bookingData.customer.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      onBlur={() => handleInputBlur('firstName')}
                      error={formErrors.firstName}
                      placeholder="Tu nombre"
                    />
                    <Input
                      label="Apellido *"
                      value={bookingData.customer.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      onBlur={() => handleInputBlur('lastName')}
                      error={formErrors.lastName}
                      placeholder="Tu apellido"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Email *"
                      type="email"
                      value={bookingData.customer.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={() => handleInputBlur('email')}
                      error={formErrors.email}
                      placeholder="tu@email.com"
                    />
                    <Input
                      label="Teléfono *"
                      type="tel"
                      value={bookingData.customer.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      onBlur={() => handleInputBlur('phone')}
                      error={formErrors.phone}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>

                  {bookingData.deliveryType === 'delivery' && (
                    <>
                      <Input
                        label="Dirección de Entrega *"
                        value={bookingData.customer.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        onBlur={() => handleInputBlur('address')}
                        error={formErrors.address}
                        placeholder="Calle, número, depto/casa"
                      />
                      <Input
                        label="Ciudad *"
                        value={bookingData.customer.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        onBlur={() => handleInputBlur('city')}
                        error={formErrors.city}
                        placeholder="Santiago, Valparaíso, etc."
                      />
                    </>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button onClick={prevStep} variant="ghost">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                      </svg>
                      Atrás
                    </Button>
                    <Button
                      onClick={() => {
                        if (!validateContactForm()) return
                        nextStep()
                      }}
                      disabled={!canContinueStep4}
                      className="bg-accent hover:bg-accent-light"
                    >
                      Continuar al Pago
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}
              {/* STEP 5: Pago */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-dark mb-2">
                      Confirmar y Pagar
                    </h2>
                    <p className="text-dark-light">
                      Elige cómo quieres pagar para confirmar tu pedido
                    </p>
                  </div>

                  {/* Trust Signals */}
                  <div className="flex flex-wrap items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">Pago 100% Seguro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">Datos protegidos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">MercadoPago</span>
                      <span className="text-sm text-green-800">Procesado por</span>
                    </div>
                  </div>

                  {/* Resumen de pago */}
                  <div className="bg-secondary/50 rounded-xl p-5 space-y-3">
                    <h3 className="font-semibold text-dark">Resumen de pago</h3>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-light">Subtotal servicios</span>
                      <span className="text-dark font-medium">{formatCurrency(bookingData.subtotal)}</span>
                    </div>
                    {bookingData.deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-light">Envío</span>
                        <span className="text-dark font-medium">{formatCurrency(bookingData.deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                      <span className="text-dark">Total del pedido</span>
                      <span className="text-accent font-display text-xl">{formatCurrency(bookingData.total)}</span>
                    </div>
                  </div>

                  {/* Error */}
                  {paymentError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      {paymentError}
                    </div>
                  )}

                  {/* Opciones de pago */}
                  <div className="space-y-3">
                    {/* Pagar depósito */}
                    <button
                      onClick={() => handlePay('deposit')}
                      disabled={isPaymentLoading}
                      className="w-full p-5 bg-white border-2 border-primary rounded-2xl text-left hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-dark group-hover:text-primary transition-colors">
                          Pagar depósito ahora
                        </span>
                        <span className="text-xl font-bold font-display text-primary">
                          {formatCurrency(Math.round(bookingData.total * depositPercentage / 100))}
                        </span>
                      </div>
                      <p className="text-sm text-dark-light">
                        {depositPercentage}% ahora para reservar tu fecha · El saldo lo pagas más adelante
                      </p>
                    </button>

                    {/* Pagar total */}
                    <button
                      onClick={() => handlePay('full')}
                      disabled={isPaymentLoading}
                      className="w-full p-5 bg-white border-2 border-gray-200 rounded-2xl text-left hover:border-accent hover:bg-accent/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-dark">
                          Pagar monto completo
                        </span>
                        <span className="text-xl font-bold font-display text-accent">
                          {formatCurrency(bookingData.total)}
                        </span>
                      </div>
                      <p className="text-sm text-dark-light">
                        Pago único · Sin saldo pendiente
                      </p>
                    </button>
                  </div>

                  <p className="text-xs text-center text-dark-light">
                    Serás redirigido al sitio oficial de MercadoPago para completar tu pago de forma segura.
                  </p>

                  {isPaymentLoading && (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-sm text-dark-light mt-2">Preparando tu pago...</p>
                    </div>
                  )}

                  {/* Botón atrás */}
                  <div className="flex justify-start pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => prevStep()}
                      disabled={isPaymentLoading}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                      </svg>
                      Atrás
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Service Cart (Desktop Only) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-20">
              <ServiceCart
                services={bookingData.services}
                subtotal={bookingData.subtotal}
                deliveryFee={bookingData.deliveryFee}
                total={bookingData.total}
                onRemoveService={removeService}
                onAddAnother={handleAddAnother}
                onContinue={handleContinueToCheckout}
              />
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Button */}
      <WhatsAppButton />
      </div>
    </div>
  )
}
