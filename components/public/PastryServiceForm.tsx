'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { PastryService } from '@/stores/bookingStoreMulti'
import { PRICES } from '@/stores/bookingStoreMulti'

interface PastryItem {
  key: keyof PastryService['items']
  name: string
  description: string
  unit: string
  price: number
  icon: string
}

const pastryItems: PastryItem[] = [
  {
    key: 'pieLimon',
    name: 'Pie de Limón',
    description: 'Base crujiente, relleno cremoso de limón y merengue tostado',
    unit: 'unidad (8-10 porciones)',
    price: PRICES.pastry.pieLimon,
    icon: '🥧',
  },
  {
    key: 'tartas',
    name: 'Tartas Variadas',
    description: 'Frutas, chocolate, queso. Elaboradas con ingredientes frescos',
    unit: 'unidad (8-10 porciones)',
    price: PRICES.pastry.tartas,
    icon: '🍰',
  },
  {
    key: 'galletas',
    name: 'Galletas Gourmet',
    description: 'Chispas de chocolate, avena, mantequilla, almendras',
    unit: 'docena',
    price: PRICES.pastry.galletas,
    icon: '🍪',
  },
  {
    key: 'rollitos',
    name: 'Rollitos de Canela',
    description: 'Recién horneados con glaseado de queso crema',
    unit: '6 unidades',
    price: PRICES.pastry.rollitos,
    icon: '🥐',
  },
]

interface PastryServiceFormProps {
  onAddService: (service: Omit<PastryService, 'id' | 'price'>) => void
  onCancel: () => void
}

export function PastryServiceForm({ onAddService, onCancel }: PastryServiceFormProps) {
  const [items, setItems] = useState<PastryService['items']>({
    pieLimon: 0,
    tartas: 0,
    galletas: 0,
    rollitos: 0,
  })

  // Calcular precio total
  const estimatedPrice = useMemo(() => {
    return (
      items.pieLimon * PRICES.pastry.pieLimon +
      items.tartas * PRICES.pastry.tartas +
      items.galletas * PRICES.pastry.galletas +
      items.rollitos * PRICES.pastry.rollitos
    )
  }, [items])

  const handleUpdateQuantity = (key: keyof PastryService['items'], delta: number) => {
    setItems((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(20, prev[key] + delta)),
    }))
  }

  const handleSubmit = () => {
    const service: Omit<PastryService, 'id' | 'price'> = {
      type: 'pasteleria',
      items,
    }

    onAddService(service)
  }

  // Al menos un item debe tener cantidad > 0
  const canSubmit = Object.values(items).some((qty) => qty > 0)
  const totalItems = Object.values(items).reduce((sum, qty) => sum + qty, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold text-dark">
            Pastelería Artesanal
          </h3>
          <p className="text-dark-light">
            Delicias frescas para endulzar tu evento
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-dark-light hover:text-dark transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Lista de productos */}
      <div className="space-y-4">
        {pastryItems.map((item) => {
          const quantity = items[item.key]
          const itemTotal = quantity * item.price

          return (
            <div
              key={item.key}
              className={cn(
                'p-6 rounded-xl border-2 transition-all duration-200',
                quantity > 0
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icono */}
                <div className="text-5xl flex-shrink-0">{item.icon}</div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-xl font-semibold text-dark mb-1">
                    {item.name}
                  </h4>
                  <p className="text-sm text-dark-light mb-2">{item.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-dark-light">{item.unit}</span>
                    <span className="text-accent font-bold">
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                </div>

                {/* Selector de cantidad */}
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-3 bg-white rounded-lg p-2 border border-border">
                    <button
                      onClick={() => handleUpdateQuantity(item.key, -1)}
                      disabled={quantity === 0}
                      className={cn(
                        'w-8 h-8 flex items-center justify-center rounded-lg transition-colors',
                        quantity === 0
                          ? 'bg-dark/5 text-dark/30 cursor-not-allowed'
                          : 'bg-dark/5 text-dark hover:bg-dark/10'
                      )}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                    </button>

                    <span className="text-2xl font-bold text-dark min-w-[40px] text-center">
                      {quantity}
                    </span>

                    <button
                      onClick={() => handleUpdateQuantity(item.key, 1)}
                      disabled={quantity >= 20}
                      className={cn(
                        'w-8 h-8 flex items-center justify-center rounded-lg transition-colors',
                        quantity >= 20
                          ? 'bg-dark/5 text-dark/30 cursor-not-allowed'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      )}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>

                  {quantity > 0 && (
                    <p className="text-right text-sm font-semibold text-accent mt-2">
                      {formatCurrency(itemTotal)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info adicional */}
      <div className="p-4 bg-info/10 rounded-xl border border-info/20">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-info flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-dark mb-1">Productos frescos</p>
            <p className="text-xs text-dark-light">
              Todos los productos se hornean y preparan el día del evento para garantizar
              máxima frescura y calidad.
            </p>
          </div>
        </div>
      </div>

      {/* Resumen y Botón */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border-2 border-primary/20">
        <div>
          <p className="text-sm text-dark-light mb-1">
            {totalItems} {totalItems === 1 ? 'producto' : 'productos'} seleccionado
            {totalItems === 1 ? '' : 's'}
          </p>
          <p className="text-3xl font-bold text-accent font-display">
            {formatCurrency(estimatedPrice)}
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="min-w-[200px]"
        >
          + Agregar al Pedido
        </Button>
      </div>

      {!canSubmit && (
        <p className="text-center text-sm text-dark-light">
          Selecciona al menos un producto para continuar
        </p>
      )}
    </div>
  )
}
