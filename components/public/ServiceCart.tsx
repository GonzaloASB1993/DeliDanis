'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { ServiceItem, TortaService, CocktailService, PastryService } from '@/stores/bookingStoreMulti'

interface ServiceCartProps {
  services: ServiceItem[]
  subtotal: number
  deliveryFee: number
  total: number
  onRemoveService: (serviceId: string) => void
  onAddAnother: () => void
  onContinue: () => void
  currentStep?: number
}

const getServiceIcon = (type: ServiceItem['type']): string => {
  switch (type) {
    case 'torta':
      return '🎂'
    case 'cocteleria':
      return '🥪'
    case 'pasteleria':
      return '🍰'
  }
}

const getServiceTitle = (service: ServiceItem): string => {
  switch (service.type) {
    case 'torta':
      return (service as TortaService).product.name
    case 'cocteleria':
      return 'Coctelería para Eventos'
    case 'pasteleria':
      return 'Pastelería Artesanal'
  }
}

const getServiceDescription = (service: ServiceItem): string => {
  switch (service.type) {
    case 'torta': {
      const tortaService = service as TortaService
      return `${tortaService.portions} porciones`
    }
    case 'cocteleria': {
      const cocktailService = service as CocktailService
      const totalUnits = Object.values(cocktailService.items).reduce((sum, qty) => sum + qty, 0)
      const productCount = Object.keys(cocktailService.items).length
      return `${productCount} ${productCount === 1 ? 'producto' : 'productos'} • ${totalUnits} unidades`
    }
    case 'pasteleria': {
      const pastryService = service as PastryService
      // Usar itemsDetails si está disponible (nuevo formato)
      if (pastryService.itemsDetails && pastryService.itemsDetails.length > 0) {
        const totalItems = pastryService.itemsDetails.reduce((sum, item) => sum + item.quantity, 0)
        const productCount = pastryService.itemsDetails.length
        return `${productCount} ${productCount === 1 ? 'producto' : 'productos'} • ${totalItems} unidades`
      }
      // Fallback al formato antiguo
      const items = Object.entries(pastryService.items)
        .filter(([_, qty]) => typeof qty === 'number' && qty > 0)
        .map(([key, qty]) => {
          const names: Record<string, string> = {
            pieLimon: 'Pie de limón',
            tartas: 'Tartas',
            galletas: 'Galletas',
            rollitos: 'Rollitos',
          }
          return `${qty}× ${names[key] || key}`
        })
      return items.join(', ') || 'Sin productos'
    }
  }
}

const ServiceDetailsExpanded = ({ service }: { service: ServiceItem }) => {
  if (service.type === 'cocteleria') {
    const cocktailService = service as CocktailService

    if (!cocktailService.itemsDetails || cocktailService.itemsDetails.length === 0) {
      return null
    }

    return (
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-xs font-semibold text-dark-light mb-2">Detalle de productos:</p>
        <div className="space-y-1">
          {cocktailService.itemsDetails.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span className="text-dark-light">
                {item.quantity}× {item.productName}
              </span>
              <span className="text-dark font-medium">
                {formatCurrency(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (service.type === 'pasteleria') {
    const pastryService = service as PastryService

    if (!pastryService.itemsDetails || pastryService.itemsDetails.length === 0) {
      return null
    }

    return (
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-xs font-semibold text-dark-light mb-2">Detalle de productos:</p>
        <div className="space-y-1">
          {pastryService.itemsDetails.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span className="text-dark-light">
                {item.quantity}× {item.productName}
              </span>
              <span className="text-dark font-medium">
                {formatCurrency(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (service.type === 'torta') {
    const tortaService = service as TortaService
    return (
      <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
        {tortaService.customizations.message && (
          <p className="text-xs text-dark-light">
            <span className="font-semibold">Mensaje:</span> {tortaService.customizations.message}
          </p>
        )}
        {tortaService.customizations.specialRequests && (
          <p className="text-xs text-dark-light">
            <span className="font-semibold">Solicitudes:</span> {tortaService.customizations.specialRequests}
          </p>
        )}
      </div>
    )
  }

  return null
}

export function ServiceCart({
  services,
  subtotal,
  deliveryFee,
  total,
  onRemoveService,
  onAddAnother,
  onContinue,
  currentStep = 2,
}: ServiceCartProps) {
  const hasServices = services.length > 0
  const [mobileCartOpen, setMobileCartOpen] = useState(false)

  // Close mobile cart when step changes (e.g., after clicking Continuar)
  useEffect(() => {
    setMobileCartOpen(false)
  }, [currentStep])

  // Lock body scroll when mobile cart is open
  useEffect(() => {
    if (mobileCartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileCartOpen])

  const cartContent = (
    <>
      {/* Header */}
      <div className="p-6 border-b border-border bg-gradient-to-br from-primary/5 to-accent/5">
        <h3 className="font-display text-2xl font-bold text-dark flex items-center gap-2">
          🛒 Tu Pedido
        </h3>
        <p className="text-sm text-dark-light mt-1">
          {services.length} {services.length === 1 ? 'servicio' : 'servicios'}
        </p>
      </div>

      {/* Services List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!hasServices ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-20">🛒</div>
            <p className="text-dark-light">
              Aún no has agregado servicios
            </p>
            <p className="text-sm text-dark-light mt-2">
              Selecciona un servicio para comenzar
            </p>
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="relative p-4 rounded-xl border-2 border-border hover:border-primary/30 transition-all duration-200 group"
            >
              {/* Remove button */}
              <button
                onClick={() => onRemoveService(service.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                title="Eliminar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Service info */}
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">
                  {getServiceIcon(service.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-dark text-sm mb-1 truncate">
                    {getServiceTitle(service)}
                  </h4>
                  <p className="text-xs text-dark-light mb-2">
                    {getServiceDescription(service)}
                  </p>
                  <p className="text-accent font-bold">
                    {formatCurrency(service.price)}
                  </p>

                  {/* Detalle expandido */}
                  <ServiceDetailsExpanded service={service} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer - Totals and Actions */}
      {hasServices && (
        <div className="p-6 border-t border-border bg-gradient-to-br from-primary/5 to-accent/5">
          {/* Totals */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-dark-light">
              <span>Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-dark-light">
                <span>Envío</span>
                <span className="font-medium">{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-primary/20 flex justify-between items-center">
              <span className="font-bold text-dark">Total</span>
              <span className="text-2xl font-bold text-accent font-display">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Actions - Only show on step 2 */}
          {currentStep === 2 && (
            <div className="space-y-2">
              <button
                onClick={() => {
                  setMobileCartOpen(false)
                  onContinue()
                }}
                className="w-full px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-hover hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Continuar</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>

              <button
                onClick={() => {
                  setMobileCartOpen(false)
                  onAddAnother()
                }}
                className="w-full px-6 py-2.5 border-2 border-primary text-primary rounded-full font-medium hover:bg-primary/10 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Agregar Otro Servicio</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Desktop cart — fixed panel */}
      <div className="fixed right-6 top-24 w-96 bg-white rounded-2xl shadow-2xl border border-border z-40 max-h-[calc(100vh-120px)] overflow-hidden flex-col hidden lg:flex">
        {cartContent}
      </div>

      {/* Mobile sticky bar — only when there are services */}
      {hasServices && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
          <div className="bg-white border-t border-border shadow-2xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛒</span>
              <div>
                <p className="text-xs text-dark-light">
                  {services.length} {services.length === 1 ? 'servicio' : 'servicios'}
                </p>
                <p className="font-bold text-accent font-display text-lg leading-tight">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setMobileCartOpen(true)}
              className="flex-1 max-w-[160px] px-4 py-2.5 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary-hover transition-colors flex items-center justify-center gap-1.5"
            >
              Ver Pedido
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Mobile fullscreen overlay */}
      {mobileCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-white">
          {/* Overlay header with close button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-display text-lg font-bold text-dark">Tu Pedido</span>
            <button
              onClick={() => setMobileCartOpen(false)}
              className="p-2 rounded-lg hover:bg-secondary text-dark-light hover:text-dark transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            {cartContent}
          </div>
        </div>
      )}
    </>
  )
}
