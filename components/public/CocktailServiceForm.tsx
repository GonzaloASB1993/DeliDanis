'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { CocktailService } from '@/stores/bookingStoreMulti'
import { PRICES } from '@/stores/bookingStoreMulti'

interface CocktailServiceFormProps {
  onAddService: (service: Omit<CocktailService, 'id' | 'price'>) => void
  onCancel: () => void
}

type CocktailType = 'dulce' | 'salada' | 'mixta'

const cocktailTypes = [
  {
    type: 'dulce' as CocktailType,
    name: 'Coctelería Dulce',
    icon: '🧁',
    description: 'Mini postres, bocaditos dulces',
    examples: ['Mini cupcakes', 'Cake pops', 'Macarons', 'Brownies mini', 'Trufas'],
  },
  {
    type: 'salada' as CocktailType,
    name: 'Coctelería Salada',
    icon: '🥪',
    description: 'Pasabocas, bocaditos salados',
    examples: ['Mini hamburguesas', 'Selladitos', 'Mini empanadas', 'Deditos de queso', 'Croquetas'],
  },
  {
    type: 'mixta' as CocktailType,
    name: 'Coctelería Mixta',
    icon: '🍽️',
    description: 'Dulce + Salada combinados',
    examples: ['Variedad dulce y salada', 'Menú completo', 'Opciones para todos'],
  },
]

export function CocktailServiceForm({ onAddService, onCancel }: CocktailServiceFormProps) {
  const [guests, setGuests] = useState(50)
  const [duration, setDuration] = useState<2 | 3 | 4>(3)
  const [cocktailType, setCocktailType] = useState<CocktailType>('mixta')
  const [includesBar, setIncludesBar] = useState(true)
  const [specialRequests, setSpecialRequests] = useState('')

  // Calcular precio estimado
  // Precio base por persona/hora (incluye pasabocas)
  const estimatedPrice = useMemo(() => {
    let price = guests * duration * PRICES.cocktail.perGuestPerHour

    // Barra/Estación de servicio completa
    if (includesBar) {
      price += PRICES.cocktail.barSetup
    }

    return price
  }, [guests, duration, includesBar])

  const handleSubmit = () => {
    const service: Omit<CocktailService, 'id' | 'price'> = {
      type: 'cocteleria',
      guests,
      duration,
      includesBar,
      specialRequests: specialRequests.trim() || undefined,
    }

    onAddService(service)
  }

  const canSubmit = guests >= 20

  const selectedType = cocktailTypes.find(t => t.type === cocktailType)!

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold text-dark">
            Coctelería para Eventos
          </h3>
          <p className="text-dark-light">
            Pasabocas dulces y salados para tu celebración
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

      {/* Tipo de coctelería */}
      <div>
        <label className="block text-sm font-medium text-dark mb-3">
          1. Tipo de coctelería
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cocktailTypes.map((type) => (
            <button
              key={type.type}
              onClick={() => setCocktailType(type.type)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                cocktailType === type.type
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-4xl">{type.icon}</div>
                {cocktailType === type.type && (
                  <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <p className="font-semibold text-dark mb-1">{type.name}</p>
              <p className="text-xs text-dark-light">{type.description}</p>
            </button>
          ))}
        </div>

        {/* Ejemplos del tipo seleccionado */}
        <div className="mt-4 p-4 bg-secondary rounded-lg">
          <p className="text-sm font-medium text-dark mb-2">Incluye opciones como:</p>
          <div className="flex flex-wrap gap-2">
            {selectedType.examples.map((example) => (
              <span
                key={example}
                className="px-3 py-1 bg-white rounded-full text-xs text-dark-light border border-border"
              >
                {example}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Número de invitados */}
      <div>
        <label className="block text-sm font-medium text-dark mb-3">
          2. Número de invitados
        </label>
        <div className="flex items-center justify-center gap-6 p-6 bg-secondary rounded-xl">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setGuests(Math.max(20, guests - 10))}
            disabled={guests <= 20}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </Button>
          <div className="text-center min-w-[140px]">
            <span className="text-4xl font-bold text-dark block">{guests}</span>
            <p className="text-dark-light text-sm mt-1">invitados</p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setGuests(Math.min(300, guests + 10))}
            disabled={guests >= 300}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </div>
        <p className="text-xs text-dark-light text-center mt-2">
          Mínimo: 20 invitados • Máximo: 300 invitados
        </p>
      </div>

      {/* Duración del servicio */}
      <div>
        <label className="block text-sm font-medium text-dark mb-3">
          3. Duración del servicio
        </label>
        <div className="grid grid-cols-3 gap-4">
          {([2, 3, 4] as const).map((hours) => (
            <button
              key={hours}
              onClick={() => setDuration(hours)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-200',
                duration === hours
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="text-3xl font-bold text-dark mb-1">{hours}</div>
              <p className="text-sm text-dark-light">horas</p>
            </button>
          ))}
        </div>
      </div>

      {/* Servicio completo o básico */}
      <div>
        <label className="block text-sm font-medium text-dark mb-3">
          4. Tipo de servicio
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setIncludesBar(true)}
            className={cn(
              'p-6 rounded-xl border-2 transition-all duration-200 text-left',
              includesBar
                ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-4xl">🍽️</div>
              {includesBar && (
                <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <p className="font-semibold text-dark mb-2">Servicio Completo</p>
            <p className="text-sm text-dark-light mb-3">
              Estación decorada, meseros, vajilla y servicio profesional
            </p>
            <p className="text-accent font-bold">
              +{formatCurrency(PRICES.cocktail.barSetup)}
            </p>
          </button>

          <button
            onClick={() => setIncludesBar(false)}
            className={cn(
              'p-6 rounded-xl border-2 transition-all duration-200 text-left',
              !includesBar
                ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-4xl">📦</div>
              {!includesBar && (
                <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <p className="font-semibold text-dark mb-2">Servicio Básico</p>
            <p className="text-sm text-dark-light mb-3">
              Solo pasabocas frescos y empacados para servir
            </p>
            <p className="text-accent font-bold">Sin cargo extra</p>
          </button>
        </div>
      </div>

      {/* Servicios incluidos */}
      <div className="p-6 bg-gradient-to-br from-info/10 to-accent/5 rounded-xl">
        <h4 className="font-semibold text-dark mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Servicios incluidos
        </h4>
        <ul className="grid grid-cols-2 gap-3">
          <li className="flex items-center gap-2 text-sm text-dark">
            <span className="text-accent">✓</span>
            Pasabocas frescos
          </li>
          <li className="flex items-center gap-2 text-sm text-dark">
            <span className="text-accent">✓</span>
            Variedad de opciones
          </li>
          <li className="flex items-center gap-2 text-sm text-dark">
            <span className="text-accent">✓</span>
            Presentación profesional
          </li>
          <li className="flex items-center gap-2 text-sm text-dark">
            <span className="text-accent">✓</span>
            Preparación el mismo día
          </li>
          {includesBar && (
            <>
              <li className="flex items-center gap-2 text-sm text-dark">
                <span className="text-accent">✓</span>
                Estación decorada
              </li>
              <li className="flex items-center gap-2 text-sm text-dark">
                <span className="text-accent">✓</span>
                Personal de servicio
              </li>
              <li className="flex items-center gap-2 text-sm text-dark">
                <span className="text-accent">✓</span>
                Vajilla desechable premium
              </li>
              <li className="flex items-center gap-2 text-sm text-dark">
                <span className="text-accent">✓</span>
                Servilletas y decoración
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Solicitudes especiales */}
      <div>
        <label className="block text-sm font-medium text-dark mb-2">
          5. Solicitudes especiales (opcional)
        </label>
        <textarea
          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
          rows={3}
          placeholder="Ej: Sin gluten, vegetariano, preferencias específicas, alergias..."
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          maxLength={200}
        />
        <p className="text-xs text-dark-light mt-1">
          {specialRequests.length}/200 caracteres
        </p>
      </div>

      {/* Precio y Botón */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border-2 border-primary/20">
        <div>
          <p className="text-sm text-dark-light mb-1">Precio estimado</p>
          <p className="text-3xl font-bold text-accent font-display">
            {formatCurrency(estimatedPrice)}
          </p>
          <p className="text-xs text-dark-light mt-1">
            {formatCurrency(PRICES.cocktail.perGuestPerHour)}/invitado/hora
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
    </div>
  )
}
