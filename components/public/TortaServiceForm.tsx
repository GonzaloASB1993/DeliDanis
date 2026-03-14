'use client'

import { useState, useMemo } from 'react'
import { ProductSelector } from './ProductSelector'
import { Button, Input } from '@/components/ui'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { ProductWithImages } from '@/types'
import type { TortaService } from '@/stores/bookingStoreMulti'

interface TortaServiceFormProps {
  eventType: string
  availableProducts: ProductWithImages[]
  onAddService: (service: Omit<TortaService, 'id' | 'price'>) => void
  onCancel: () => void
}

export function TortaServiceForm({
  eventType,
  availableProducts,
  onAddService,
  onCancel,
}: TortaServiceFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductWithImages | null>(null)
  const [portions, setPortions] = useState(15)
  const [message, setMessage] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  // Mostrar todos los productos disponibles (sin filtrar por evento)
  // El cliente puede elegir cualquier torta para cualquier tipo de evento
  const filteredProducts = availableProducts

  // Calcular precio estimado
  const estimatedPrice = useMemo(() => {
    if (!selectedProduct) return 0

    let price = selectedProduct.base_price

    if (portions > selectedProduct.min_portions && selectedProduct.price_per_portion) {
      const additionalPortions = portions - selectedProduct.min_portions
      price = selectedProduct.base_price + additionalPortions * selectedProduct.price_per_portion
    }

    return price
  }, [selectedProduct, portions])

  const handleSubmit = () => {
    if (!selectedProduct) return

    const service: Omit<TortaService, 'id' | 'price'> = {
      type: 'torta',
      product: selectedProduct,
      portions,
      customizations: {
        message: message.trim() || undefined,
        specialRequests: specialRequests.trim() || undefined,
      },
    }

    onAddService(service)
  }

  const canSubmit = selectedProduct && portions >= (selectedProduct.min_portions || 15)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold text-dark">
            Tortas Personalizadas
          </h3>
          <p className="text-dark-light">
            {filteredProducts.length} sabores disponibles para tu evento
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

      {/* Selector de Producto */}
      <div>
        <label className="block text-sm font-medium text-dark mb-3">
          1. Selecciona el sabor
        </label>
        <ProductSelector
          products={filteredProducts}
          selectedProduct={selectedProduct}
          onSelectProduct={setSelectedProduct}
        />
      </div>

      {selectedProduct && (
        <>
          {/* Porciones */}
          <div>
            <label className="block text-sm font-medium text-dark mb-3">
              2. ¿Cuántas porciones?
            </label>
            <div className="flex items-center justify-center gap-6 p-6 bg-secondary rounded-xl">
              <Button
                variant="secondary"
                size="lg"
                onClick={() =>
                  setPortions(Math.max(selectedProduct.min_portions, portions - 5))
                }
                disabled={portions <= selectedProduct.min_portions}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </Button>
              <div className="text-center min-w-[120px]">
                <span className="text-4xl font-bold text-dark block">{portions}</span>
                <p className="text-dark-light text-sm mt-1">porciones</p>
              </div>
              <Button
                variant="secondary"
                size="lg"
                onClick={() =>
                  setPortions(Math.min(selectedProduct.max_portions, portions + 5))
                }
                disabled={portions >= selectedProduct.max_portions}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Button>
            </div>
            <p className="text-xs text-dark-light text-center mt-2">
              Mínimo: {selectedProduct.min_portions} • Máximo: {selectedProduct.max_portions}
            </p>
          </div>

          {/* Personalización */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-dark">
              3. Personaliza tu torta (opcional)
            </label>
            <div>
              <Input
                type="text"
                placeholder="Mensaje en la torta (ej: Feliz Cumpleaños María)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-dark-light mt-1">
                {message.length}/50 caracteres
              </p>
            </div>
            <div>
              <textarea
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                rows={3}
                placeholder="Solicitudes especiales (alergias, preferencias de decoración, etc.)"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-dark-light mt-1">
                {specialRequests.length}/200 caracteres
              </p>
            </div>
          </div>

          {/* Precio y Botón */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border-2 border-primary/20">
            <div>
              <p className="text-sm text-dark-light mb-1">Precio estimado</p>
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
        </>
      )}

      {!selectedProduct && (
        <div className="text-center py-12 text-dark-light">
          Selecciona un sabor para continuar
        </div>
      )}
    </div>
  )
}
