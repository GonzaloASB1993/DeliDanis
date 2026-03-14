'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  createProductionOrder,
  getConfirmedOrders,
  type ConfirmedOrderForProduction,
} from '@/lib/supabase/production-queries'
import {
  getCakeProductsAdmin,
  getCocktailProductsAdmin,
  getPastryProductsAdmin,
} from '@/lib/supabase/catalog-mutations'

type ProductType = 'cake' | 'cocktail' | 'pastry'
type ProductionMode = null | 'order' | 'stock'

interface NewProductionModalProps {
  onClose: () => void
  onCreated: () => void
}

const TYPE_TABS: { value: ProductType; label: string }[] = [
  { value: 'cake', label: 'Tortas' },
  { value: 'cocktail', label: 'Coctelería' },
  { value: 'pastry', label: 'Pastelería' },
]

const SERVICE_TYPE_MAP: Record<string, ProductType> = {
  torta: 'cake',
  cocteleria: 'cocktail',
  pasteleria: 'pastry',
}

// Extract producible items from an order's items
function extractProductsFromOrder(order: ConfirmedOrderForProduction): Array<{
  product_id: string
  product_type: ProductType
  product_name: string
  quantity: number
}> {
  const products: Array<{
    product_id: string
    product_type: ProductType
    product_name: string
    quantity: number
  }> = []

  for (const item of order.items) {
    const productType = SERVICE_TYPE_MAP[item.service_type]
    if (!productType) continue

    const serviceData = item.service_data as any

    if (item.service_type === 'torta') {
      // Torta: single product from service_data.product
      const productId = serviceData?.product?.id
      if (productId) {
        products.push({
          product_id: productId,
          product_type: 'cake',
          product_name: serviceData.product.name || item.product_name || 'Torta',
          quantity: 1,
        })
      }
    } else {
      // Cocktail/Pastry: multiple items from service_data.itemsDetails
      const itemsDetails = serviceData?.itemsDetails as Array<{
        productId: string
        productName: string
        quantity: number
      }> | undefined

      if (itemsDetails) {
        for (const detail of itemsDetails) {
          products.push({
            product_id: detail.productId,
            product_type: productType,
            product_name: detail.productName,
            quantity: detail.quantity,
          })
        }
      }
    }
  }

  return products
}

export function NewProductionModal({ onClose, onCreated }: NewProductionModalProps) {
  // Step 1: Choose mode
  const [mode, setMode] = useState<ProductionMode>(null)

  // Order mode
  const [confirmedOrders, setConfirmedOrders] = useState<ConfirmedOrderForProduction[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [orderProducts, setOrderProducts] = useState<Array<{
    product_id: string
    product_type: ProductType
    product_name: string
    quantity: number
    selected: boolean
  }>>([])

  // Stock mode
  const [productType, setProductType] = useState<ProductType>('cake')
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // Shared
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)

  // Load confirmed orders when entering order mode
  useEffect(() => {
    if (mode === 'order') {
      setIsLoadingOrders(true)
      getConfirmedOrders()
        .then(setConfirmedOrders)
        .finally(() => setIsLoadingOrders(false))
    }
  }, [mode])

  // When an order is selected, extract its products
  useEffect(() => {
    if (!selectedOrderId) {
      setOrderProducts([])
      return
    }
    const order = confirmedOrders.find(o => o.id === selectedOrderId)
    if (!order) return

    const extracted = extractProductsFromOrder(order)
    setOrderProducts(extracted.map(p => ({ ...p, selected: true })))
  }, [selectedOrderId, confirmedOrders])

  // Load catalog products when type changes (stock mode)
  useEffect(() => {
    if (mode !== 'stock') return
    setIsLoadingProducts(true)
    setSelectedProductId('')

    const loadProducts = async () => {
      try {
        let data: any[] = []
        if (productType === 'cake') {
          data = await getCakeProductsAdmin()
        } else if (productType === 'cocktail') {
          data = await getCocktailProductsAdmin()
        } else {
          data = await getPastryProductsAdmin()
        }
        setProducts(data.map((p: any) => ({ id: p.id, name: p.name })))
      } catch (error) {
        console.error('Error loading products:', error)
        setProducts([])
      } finally {
        setIsLoadingProducts(false)
      }
    }

    loadProducts()
  }, [productType, mode])

  const handleSubmitOrder = async () => {
    const selectedItems = orderProducts.filter(p => p.selected)
    if (selectedItems.length === 0) return

    setIsSaving(true)
    try {
      for (const item of selectedItems) {
        await createProductionOrder({
          order_id: selectedOrderId,
          product_id: item.product_id,
          product_type: item.product_type,
          product_name: item.product_name,
          quantity: item.quantity,
          notes: notes.trim() || undefined,
        })
      }
      onCreated()
    } catch (error) {
      console.error('Error creating production orders:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmitStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId) return

    const selectedProduct = products.find(p => p.id === selectedProductId)
    if (!selectedProduct) return

    setIsSaving(true)
    try {
      await createProductionOrder({
        product_id: selectedProductId,
        product_type: productType,
        product_name: selectedProduct.name,
        quantity: parseInt(quantity) || 1,
        notes: notes.trim() || undefined,
      })
      onCreated()
    } catch (error) {
      console.error('Error creating production order:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleOrderProduct = (index: number) => {
    setOrderProducts(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], selected: !updated[index].selected }
      return updated
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <div className="flex items-center gap-3">
            {mode && (
              <button
                onClick={() => { setMode(null); setSelectedOrderId(''); setOrderProducts([]) }}
                className="p-1 hover:bg-secondary rounded-lg text-dark-light"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-display font-bold text-dark">
              Nueva Producción
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg text-dark-light">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Choose mode */}
          {!mode && (
            <div className="space-y-3">
              <p className="text-sm text-dark-light mb-4">¿Qué tipo de producción deseas iniciar?</p>

              <button
                onClick={() => setMode('order')}
                className="w-full p-4 border-2 border-gray-200 rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-200 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-dark">Producir para un pedido</p>
                    <p className="text-sm text-dark-light">Selecciona un pedido confirmado y produce sus productos</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('stock')}
                className="w-full p-4 border-2 border-gray-200 rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-200 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-dark">Producir para stock</p>
                    <p className="text-sm text-dark-light">Produce productos para venta libre sin pedido asociado</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Mode: Order */}
          {mode === 'order' && (
            <div className="space-y-5">
              {/* Order selector */}
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Pedido confirmado *</label>
                {isLoadingOrders ? (
                  <div className="w-full px-4 py-2 border border-gray-200 rounded-lg text-dark-light">
                    Cargando pedidos...
                  </div>
                ) : confirmedOrders.length === 0 ? (
                  <div className="p-4 bg-secondary rounded-lg text-center text-dark-light text-sm">
                    No hay pedidos confirmados disponibles
                  </div>
                ) : (
                  <select
                    value={selectedOrderId}
                    onChange={e => setSelectedOrderId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="">Seleccionar pedido...</option>
                    {confirmedOrders.map(order => (
                      <option key={order.id} value={order.id}>
                        {order.order_number} — {order.customer_name} ({order.event_date})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Products from order */}
              {selectedOrderId && orderProducts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Productos a producir</label>
                  <div className="space-y-2">
                    {orderProducts.map((product, index) => (
                      <label
                        key={index}
                        className={cn(
                          'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                          product.selected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={product.selected}
                          onChange={() => toggleOrderProduct(index)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-dark text-sm">{product.product_name}</p>
                          <p className="text-xs text-dark-light">
                            {product.product_type === 'cake' ? 'Torta' : product.product_type === 'cocktail' ? 'Coctelería' : 'Pastelería'}
                            {product.quantity > 1 && ` x${product.quantity}`}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrderId && orderProducts.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  No se pudieron extraer productos de este pedido. Los productos pueden no tener IDs asociados.
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Notas</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  placeholder="Instrucciones especiales..."
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-dark-light hover:bg-secondary rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSaving || orderProducts.filter(p => p.selected).length === 0}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Creando...' : `Crear ${orderProducts.filter(p => p.selected).length} Producción(es)`}
                </button>
              </div>
            </div>
          )}

          {/* Mode: Stock */}
          {mode === 'stock' && (
            <form onSubmit={handleSubmitStock} className="space-y-5">
              {/* Product type */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Tipo de producto</label>
                <div className="flex gap-2">
                  {TYPE_TABS.map(tab => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setProductType(tab.value)}
                      className={cn(
                        'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        productType === tab.value
                          ? 'bg-primary text-white'
                          : 'bg-secondary text-dark-light hover:bg-gray-200'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product selector */}
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Producto *</label>
                {isLoadingProducts ? (
                  <div className="w-full px-4 py-2 border border-gray-200 rounded-lg text-dark-light">
                    Cargando productos...
                  </div>
                ) : (
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Notas</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  placeholder="Instrucciones especiales..."
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-dark-light hover:bg-secondary rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !selectedProductId}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Creando...' : 'Crear Producción'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
