'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { PastryService } from '@/stores/bookingStoreMulti'
import type { ProductWithImages } from '@/types'

interface PastryServiceFormProps {
  availableProducts: ProductWithImages[]
  onAddService: (service: Omit<PastryService, 'id' | 'price'>) => void
  onCancel: () => void
}

export function PastryServiceForm({ availableProducts, onAddService, onCancel }: PastryServiceFormProps) {
  // Estado: producto ID -> cantidad
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})

  // Calcular precio total
  const estimatedPrice = useMemo(() => {
    return Object.entries(selectedItems).reduce((sum, [productId, quantity]) => {
      const product = availableProducts.find((p) => p.id === productId)
      if (!product) return sum
      return sum + (product.price || product.base_price || 0) * quantity
    }, 0)
  }, [selectedItems, availableProducts])

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setSelectedItems((prev) => {
      const currentQty = prev[productId] || 0
      const newQty = Math.max(0, Math.min(20, currentQty + delta))

      if (newQty === 0) {
        const { [productId]: _, ...rest } = prev
        return rest
      }

      return { ...prev, [productId]: newQty }
    })
  }

  const handleSubmit = () => {
    // Construir detalles de los items para mostrar en el carrito
    const itemsDetails: Array<{
      productId: string
      productName: string
      quantity: number
      unitPrice: number
      imageUrl: string | null
    }> = []

    Object.entries(selectedItems).forEach(([productId, quantity]) => {
      const product = availableProducts.find((p) => p.id === productId)
      if (product && quantity > 0) {
        // Buscar imagen principal, con fallback a image_url del producto
        const images = product.images || []
        const primaryImage = images.find((img: any) => img.is_primary) || images[0]
        const imageUrl = primaryImage?.url || (product as any).image_url || null

        itemsDetails.push({
          productId,
          productName: product.name,
          quantity,
          unitPrice: product.price || product.base_price || 0,
          imageUrl,
        })
      }
    })

    const service: any = {
      type: 'pasteleria',
      items: selectedItems,
      itemsDetails, // Guardar detalles para mostrar en el carrito
      calculatedPrice: estimatedPrice, // Enviar precio ya calculado
    }

    onAddService(service)
  }

  // Al menos un item debe tener cantidad > 0
  const canSubmit = Object.values(selectedItems).some((qty) => qty > 0)
  const totalItems = Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0)

  // Obtener imagen principal de un producto
  const getProductImage = (product: ProductWithImages) => {
    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]
    // Usar image_url como fallback si no hay imágenes en el array
    return primaryImage?.url || (product as any).image_url || null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold text-dark">
            Pastelería Artesanal
          </h3>
          <p className="text-dark-light">
            {availableProducts.length} productos disponibles
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
        {availableProducts.map((product) => {
          const quantity = selectedItems[product.id] || 0
          const productPrice = product.price || product.base_price || 0
          const itemTotal = quantity * productPrice
          const imageUrl = getProductImage(product)

          return (
            <div
              key={product.id}
              className={cn(
                'p-6 rounded-xl border-2 transition-all duration-200',
                quantity > 0
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Imagen del producto */}
                <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br from-secondary to-primary/10 overflow-hidden relative">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">
                      🥧
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-xl font-semibold text-dark mb-1">
                    {product.name}
                  </h4>
                  <p className="text-sm text-dark-light mb-2 line-clamp-2">
                    {product.description || product.short_description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    {product.unit && (
                      <span className="text-dark-light">{product.unit}</span>
                    )}
                    <span className="text-accent font-bold">
                      {formatCurrency(productPrice)}
                    </span>
                    {product.min_order_quantity && product.min_order_quantity > 1 && (
                      <span className="text-xs text-dark-light bg-secondary px-2 py-1 rounded">
                        Min. {product.min_order_quantity} unidades
                      </span>
                    )}
                  </div>
                </div>

                {/* Selector de cantidad */}
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-3 bg-white rounded-lg p-2 border border-border">
                    <button
                      onClick={() => handleUpdateQuantity(product.id, -1)}
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
                      onClick={() => handleUpdateQuantity(product.id, 1)}
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

      {/* Mensaje si no hay productos */}
      {availableProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🥧</div>
          <p className="text-dark-light">No hay productos de pastelería disponibles</p>
        </div>
      )}

      {/* Info adicional */}
      {availableProducts.length > 0 && (
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
      )}

      {/* Resumen y Boton */}
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
