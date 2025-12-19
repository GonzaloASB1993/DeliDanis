'use client'

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
      return `${cocktailService.guests} invitados × ${cocktailService.duration} hrs`
    }
    case 'pasteleria': {
      const pastryService = service as PastryService
      const items = Object.entries(pastryService.items)
        .filter(([_, qty]) => qty > 0)
        .map(([key, qty]) => {
          const names: Record<string, string> = {
            pieLimon: 'Pie de limón',
            tartas: 'Tartas',
            galletas: 'Galletas',
            rollitos: 'Rollitos',
          }
          return `${qty}× ${names[key]}`
        })
      return items.join(', ')
    }
  }
}

export function ServiceCart({
  services,
  subtotal,
  deliveryFee,
  total,
  onRemoveService,
  onAddAnother,
  onContinue,
}: ServiceCartProps) {
  const hasServices = services.length > 0

  return (
    <div className="fixed right-6 top-24 w-96 bg-white rounded-2xl shadow-2xl border border-border z-40 max-h-[calc(100vh-120px)] overflow-hidden flex flex-col hidden lg:flex">
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
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

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={onContinue}
              className="w-full px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-hover hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Continuar</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>

            <button
              onClick={onAddAnother}
              className="w-full px-6 py-2.5 border-2 border-primary text-primary rounded-full font-medium hover:bg-primary/10 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Agregar Otro Servicio</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile version indicator */}
      <div className="lg:hidden p-4 bg-info/10 border-t border-info/20">
        <p className="text-xs text-center text-info">
          El resumen del pedido se muestra en la parte inferior en móvil
        </p>
      </div>
    </div>
  )
}
