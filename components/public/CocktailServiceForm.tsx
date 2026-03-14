'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Button, Input } from '@/components/ui'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { CocktailService } from '@/stores/bookingStoreMulti'
import type { ProductWithImages } from '@/types'

interface CocktailServiceFormProps {
  availableProducts: ProductWithImages[]
  onAddService: (service: Omit<CocktailService, 'id' | 'price'>) => void
  onCancel: () => void
}

const MIN_ORDER_AMOUNT = 50000 // Minimo $50,000

export function CocktailServiceForm({ availableProducts, onAddService, onCancel }: CocktailServiceFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [tempQuantity, setTempQuantity] = useState(15)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [specialRequests, setSpecialRequests] = useState('')

  // Obtener categorias unicas de los productos
  const categories = useMemo(() => {
    const cats = new Set<string>()
    availableProducts.forEach((p) => {
      if (p.category?.name) cats.add(p.category.name)
      // Fallback: usar subcategory.category si existe
      const subCat = p.subcategory as any
      if (subCat?.category?.name) cats.add(subCat.category.name)
    })
    return Array.from(cats)
  }, [availableProducts])

  // Obtener subcategorias segun categoria seleccionada
  const subcategories = useMemo(() => {
    if (!selectedCategory) return []
    const subs = new Set<string>()
    availableProducts.forEach((p) => {
      const catName = p.category?.name || (p.subcategory as any)?.category?.name
      if (catName === selectedCategory && p.subcategory?.name) {
        subs.add(p.subcategory.name)
      }
    })
    return Array.from(subs)
  }, [availableProducts, selectedCategory])

  // Obtener productos segun categoria y subcategoria
  const filteredProducts = useMemo(() => {
    if (!selectedSubcategory) return []
    return availableProducts.filter((p) => {
      const catName = p.category?.name || (p.subcategory as any)?.category?.name
      return catName === selectedCategory && p.subcategory?.name === selectedSubcategory
    })
  }, [availableProducts, selectedCategory, selectedSubcategory])

  // Calcular total
  const totalAmount = useMemo(() => {
    return Object.entries(selectedItems).reduce((sum, [productId, quantity]) => {
      const product = availableProducts.find((p) => p.id === productId)
      if (!product) return sum
      return sum + (product.price || product.base_price || 0) * quantity
    }, 0)
  }, [selectedItems, availableProducts])

  const totalUnits = useMemo(() => {
    return Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0)
  }, [selectedItems])

  // Obtener imagen principal de un producto
  const getProductImage = (product: ProductWithImages) => {
    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]
    // Usar image_url como fallback si no hay imágenes en el array
    return primaryImage?.url || (product as any).image_url || null
  }

  // Handler para abrir modal de cantidad
  const handleAddProduct = (productId: string) => {
    setSelectedProductId(productId)
    setTempQuantity(15)
    setShowQuantityModal(true)
  }

  // Handler para confirmar cantidad
  const handleConfirmQuantity = () => {
    if (!selectedProductId || tempQuantity < 15) return

    setSelectedItems((prev) => ({
      ...prev,
      [selectedProductId]: (prev[selectedProductId] || 0) + tempQuantity,
    }))

    setShowQuantityModal(false)
    setSelectedProductId('')
    setTempQuantity(15)
  }

  // Handler para actualizar cantidad de un item
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 15) {
      const { [productId]: _, ...rest } = selectedItems
      setSelectedItems(rest)
    } else {
      setSelectedItems((prev) => ({
        ...prev,
        [productId]: newQuantity,
      }))
    }
  }

  // Handler para eliminar item
  const handleRemoveItem = (productId: string) => {
    const { [productId]: _, ...rest } = selectedItems
    setSelectedItems(rest)
  }

  const handleSubmit = () => {
    if (totalAmount < MIN_ORDER_AMOUNT) return

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
      type: 'cocteleria',
      items: selectedItems,
      itemsDetails, // Guardar detalles para mostrar en el carrito
      specialRequests: specialRequests.trim() || undefined,
      calculatedPrice: totalAmount, // Enviar precio ya calculado
    }

    onAddService(service)
  }

  const canSubmit = totalAmount >= MIN_ORDER_AMOUNT
  const selectedProduct = selectedProductId
    ? availableProducts.find((p) => p.id === selectedProductId)
    : null

  // Auto-seleccionar primera categoria si hay productos
  useMemo(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0])
    }
  }, [categories, selectedCategory])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="font-display text-2xl md:text-3xl font-bold text-dark flex items-center gap-3">
            <span className="text-3xl">🥂</span>
            Cocteleria para Eventos
          </h3>
          <p className="text-dark-light mt-1">
            Pedido minimo: {formatCurrency(MIN_ORDER_AMOUNT)}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-dark-light hover:text-dark transition-colors p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Category Selection */}
      {categories.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-dark mb-4">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm mr-2">
              1
            </span>
            Selecciona el tipo de cocteleria
          </label>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat)
                  setSelectedSubcategory('')
                  setSelectedProductId('')
                }}
                className={cn(
                  'group relative py-6 px-6 rounded-2xl font-semibold transition-all duration-300 border-2 overflow-hidden',
                  selectedCategory === cat
                    ? 'bg-gradient-to-br from-primary to-primary-hover border-primary text-white shadow-xl scale-105'
                    : 'bg-white border-border text-dark hover:border-primary/50 hover:shadow-lg hover:scale-102'
                )}
              >
                <div className="flex flex-col items-center gap-3 relative z-10">
                  <span className="text-5xl transform transition-transform group-hover:scale-110">
                    {cat.toLowerCase().includes('dulce') ? '🧁' : '🥪'}
                  </span>
                  <span className="text-lg font-bold">{cat}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subcategory Selection */}
      {subcategories.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-dark mb-4">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm mr-2">
              2
            </span>
            Selecciona la categoria de productos
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  setSelectedSubcategory(sub)
                  setSelectedProductId('')
                }}
                className={cn(
                  'py-4 px-5 rounded-xl font-medium transition-all duration-200 border-2 text-left',
                  selectedSubcategory === sub
                    ? 'bg-primary/10 border-primary text-primary shadow-md scale-105'
                    : 'bg-white border-border text-dark hover:border-primary/30 hover:bg-primary/5'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    selectedSubcategory === sub ? "bg-primary" : "bg-gray-300"
                  )} />
                  <span className="font-semibold text-sm">{sub}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product Selection */}
      {selectedSubcategory && filteredProducts.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-dark mb-4">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm mr-2">
              3
            </span>
            Selecciona los productos
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            {filteredProducts.map((product) => {
              const imageUrl = getProductImage(product)
              const productPrice = product.price || product.base_price || 0
              const minQty = product.min_order_quantity || 15

              return (
                <div
                  key={product.id}
                  className="group relative bg-gradient-to-br from-white to-secondary/30 border-2 border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden relative">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">
                          {selectedCategory.toLowerCase().includes('dulce') ? '🧁' : '🥪'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-dark mb-1 text-base">
                        {product.name}
                      </h4>
                      <p className="text-sm text-dark-light mb-3 line-clamp-2">
                        {product.description || product.short_description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-accent font-bold text-lg font-display">
                            {formatCurrency(productPrice)}
                          </p>
                          <p className="text-xs text-dark-light">
                            min. {minQty} unidades
                          </p>
                        </div>
                        <Button
                          onClick={() => handleAddProduct(product.id)}
                          size="sm"
                          className="bg-primary hover:bg-primary-hover shadow-md"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mensaje si no hay productos */}
      {availableProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🥂</div>
          <p className="text-dark-light">No hay productos de cocteleria disponibles</p>
        </div>
      )}

      {/* Selected Items List */}
      {Object.keys(selectedItems).length > 0 && (
        <div className="border-2 border-primary/30 rounded-2xl p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent shadow-lg">
          <h4 className="font-bold text-dark mb-4 flex items-center gap-2 text-lg">
            <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
            Productos Seleccionados ({Object.keys(selectedItems).length})
          </h4>
          <div className="space-y-3">
            {Object.entries(selectedItems).map(([productId, quantity]) => {
              const product = availableProducts.find((p) => p.id === productId)
              if (!product) return null
              const productPrice = product.price || product.base_price || 0

              return (
                <div
                  key={productId}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-dark">{product.name}</p>
                    <p className="text-sm text-dark-light mt-1">
                      {formatCurrency(productPrice)} x {quantity} = {' '}
                      <span className="font-bold text-accent">
                        {formatCurrency(productPrice * quantity)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => handleUpdateQuantity(productId, quantity - 5)}
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => handleUpdateQuantity(productId, parseInt(e.target.value) || 15)}
                        className="w-16 text-center font-bold text-dark bg-transparent border-none focus:outline-none"
                        min={15}
                      />
                      <button
                        onClick={() => handleUpdateQuantity(productId, quantity + 5)}
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(productId)}
                      className="w-9 h-9 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totals */}
          <div className="mt-5 pt-5 border-t-2 border-border">
            <div className="flex justify-between items-center mb-3">
              <span className="text-dark-light font-medium">Total de unidades:</span>
              <span className="font-bold text-dark text-lg">{totalUnits}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-dark text-lg">Total:</span>
              <span className="text-3xl font-bold text-accent font-display">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            {totalAmount < MIN_ORDER_AMOUNT && (
              <div className="bg-warning/10 border-2 border-warning/30 rounded-xl p-4 mt-3">
                <p className="text-sm text-warning flex items-center gap-2 font-medium">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Faltan {formatCurrency(MIN_ORDER_AMOUNT - totalAmount)} para alcanzar el pedido minimo
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Special Requests */}
      <div>
        <label className="block text-sm font-semibold text-dark mb-2">
          Solicitudes especiales (opcional)
        </label>
        <textarea
          className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none bg-white"
          rows={3}
          placeholder="Ej: Sin gluten, vegetariano, alergias especificas..."
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          maxLength={200}
        />
        <p className="text-xs text-dark-light mt-1">
          {specialRequests.length}/200 caracteres
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button variant="ghost" onClick={onCancel} className="flex-1 border-2 border-border">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 bg-gradient-to-r from-accent to-accent-light hover:from-accent-light hover:to-accent shadow-lg disabled:from-gray-300 disabled:to-gray-400"
        >
          {Object.keys(selectedItems).length === 0
            ? 'Selecciona productos'
            : `Agregar al Pedido (${formatCurrency(totalAmount)})`}
        </Button>
      </div>

      {/* Quantity Modal */}
      {showQuantityModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform animate-scaleIn">
            <h4 className="font-display text-2xl font-bold text-dark mb-2">
              Cuantas unidades?
            </h4>
            <p className="text-dark mb-2 font-semibold">{selectedProduct.name}</p>
            <p className="text-dark-light mb-6 text-sm">
              {formatCurrency(selectedProduct.price || selectedProduct.base_price || 0)}/unidad - Minimo: {selectedProduct.min_order_quantity || 15} unidades
            </p>

            <div className="flex items-center justify-center gap-6 mb-8">
              <button
                onClick={() => setTempQuantity(Math.max(selectedProduct.min_order_quantity || 15, tempQuantity - 5))}
                className="w-14 h-14 flex items-center justify-center bg-gray-200 rounded-xl hover:bg-gray-300 transition-all hover:scale-110 active:scale-95"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                </svg>
              </button>
              <div className="text-center">
                <input
                  type="number"
                  value={tempQuantity}
                  onChange={(e) => setTempQuantity(Math.max(selectedProduct.min_order_quantity || 15, parseInt(e.target.value) || 15))}
                  className="w-28 text-center text-4xl font-bold text-dark border-2 border-border rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  min={selectedProduct.min_order_quantity || 15}
                />
                <p className="text-sm text-dark-light mt-2 font-medium">unidades</p>
              </div>
              <button
                onClick={() => setTempQuantity(tempQuantity + 5)}
                className="w-14 h-14 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primary-hover transition-all hover:scale-110 active:scale-95 shadow-lg"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl p-5 mb-6 border-2 border-accent/20">
              <div className="flex justify-between items-center">
                <span className="text-dark-light font-medium">Subtotal:</span>
                <span className="text-3xl font-bold text-accent font-display">
                  {formatCurrency((selectedProduct.price || selectedProduct.base_price || 0) * tempQuantity)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowQuantityModal(false)
                  setSelectedProductId('')
                  setTempQuantity(15)
                }}
                className="flex-1 border-2 border-border"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmQuantity}
                disabled={tempQuantity < (selectedProduct.min_order_quantity || 15)}
                className="flex-1 bg-primary hover:bg-primary-hover shadow-lg"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Animaciones CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
