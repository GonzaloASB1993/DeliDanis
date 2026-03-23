'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import {
  getOrderById,
  updateOrderStatus,
  addPayment,
  updateOrder,
  type OrderWithDetails
} from '@/lib/supabase/orders-queries'
import { getProductionCostsByOrderIds } from '@/lib/supabase/production-queries'

interface OrderDetailModalProps {
  orderId: string | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

// Hitos del pedido (flujo principal)
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente', color: 'bg-orange-100 text-orange-700' },
  { value: 'confirmed', label: 'Confirmado', color: 'bg-green-100 text-green-700' },
  { value: 'in_production', label: 'En Producción', color: 'bg-blue-100 text-blue-700' },
  { value: 'ready', label: 'Listo', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'delivered', label: 'Entregado', color: 'bg-emerald-100 text-emerald-700' },
]

// Todos los estados (para historial y labels)
const ALL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-orange-100 text-orange-700' },
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-700' },
  in_production: { label: 'En Producción', color: 'bg-blue-100 text-blue-700' },
  ready: { label: 'Listo', color: 'bg-cyan-100 text-cyan-700' },
  delivered: { label: 'Entregado', color: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Completado', color: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'mercadopago', label: 'Mercado Pago' },
]

// Helper para obtener imagen principal de un producto
function getProductImage(product: any): string | null {
  if (!product?.images || product.images.length === 0) return null
  const primaryImage = product.images.find((img: any) => img.is_primary) || product.images[0]
  return primaryImage?.url || null
}

// Componente para mostrar el detalle del servicio desde service_data
function ServiceDataDetail({ serviceData, serviceType }: { serviceData: Record<string, unknown>, serviceType: string }) {
  if (serviceType === 'torta') {
    const tortaData = serviceData as any
    const imageUrl = getProductImage(tortaData.product)

    return (
      <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
        {tortaData.product?.name && (
          <div className="flex items-start gap-4">
            {/* Imagen del producto */}
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-pink-100 to-pink-50 overflow-hidden flex-shrink-0 relative">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={tortaData.product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl">
                  🎂
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-dark">{tortaData.product.name}</p>
              {tortaData.product.description && (
                <p className="text-xs text-dark-light line-clamp-2 mt-1">{tortaData.product.description}</p>
              )}
              {tortaData.portions && (
                <p className="text-sm text-primary font-medium mt-1">{tortaData.portions} porciones</p>
              )}
            </div>
          </div>
        )}
        {tortaData.customizations?.message && (
          <p className="text-sm bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            <span className="font-medium text-yellow-800">Mensaje en torta:</span>{' '}
            <span className="text-yellow-700">"{tortaData.customizations.message}"</span>
          </p>
        )}
        {tortaData.customizations?.specialRequests && (
          <p className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <span className="font-medium text-blue-800">Solicitudes especiales:</span>{' '}
            <span className="text-blue-700">{tortaData.customizations.specialRequests}</span>
          </p>
        )}
      </div>
    )
  }

  if (serviceType === 'cocteleria' || serviceType === 'pasteleria') {
    const serviceDataTyped = serviceData as any
    const itemsDetails = serviceDataTyped.itemsDetails as Array<{
      productId: string
      productName: string
      quantity: number
      unitPrice: number
      imageUrl?: string | null
    }> | undefined

    if (!itemsDetails || itemsDetails.length === 0) {
      return null
    }

    return (
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-xs font-semibold text-dark-light uppercase mb-2">Detalle de productos:</p>
        <div className="bg-secondary/50 rounded-lg p-3 space-y-3">
          {itemsDetails.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {/* Imagen del producto */}
              <div className="w-12 h-12 rounded-lg bg-white border border-border overflow-hidden flex-shrink-0 relative">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xl">
                    {serviceType === 'cocteleria' ? '🥪' : '🥧'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark truncate">{item.productName}</p>
                <p className="text-xs text-dark-light">
                  {formatCurrency(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <span className="text-sm font-semibold text-accent">
                {formatCurrency(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        {serviceDataTyped.specialRequests && (
          <p className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-2">
            <span className="font-medium text-blue-800">Solicitudes:</span>{' '}
            <span className="text-blue-700">{serviceDataTyped.specialRequests}</span>
          </p>
        )}
      </div>
    )
  }

  return null
}

export function OrderDetailModal({ orderId, isOpen, onClose, onUpdate }: OrderDetailModalProps) {
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'detail' | 'payments' | 'history'>('detail')

  // Form states
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('transfer')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Costos de producción
  const [productionCost, setProductionCost] = useState<number | null>(null)

  // Edición
  const [isEditing, setIsEditing] = useState(false)
  const [editNotes, setEditNotes] = useState('')
  const [editSpecialRequests, setEditSpecialRequests] = useState('')

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrder()
    }
  }, [isOpen, orderId])

  useEffect(() => {
    if (order) {
      setEditNotes(order.notes || '')
      setEditSpecialRequests(order.special_requests || '')
    }
  }, [order])

  const loadOrder = async () => {
    if (!orderId) return
    setIsLoading(true)
    try {
      const data = await getOrderById(orderId)
      setOrder(data)

      // Load production cost
      try {
        const costs = await getProductionCostsByOrderIds([orderId])
        setProductionCost(costs[orderId] ?? null)
      } catch {
        setProductionCost(null)
      }
    } catch (error) {
      console.error('Error loading order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return
    setIsSaving(true)
    try {
      await updateOrderStatus(order.id, newStatus)

      // Send email to client on status changes
      if (newStatus === 'confirmed') {
        fetch('/api/email/confirm-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id }),
        }).catch(console.error)
      } else if (newStatus === 'ready') {
        fetch('/api/email/order-ready', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id }),
        }).catch(console.error)
      }

      await loadOrder()
      onUpdate?.()
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) return

    setIsSaving(true)
    try {
      await addPayment(order.id, amount, paymentMethod, paymentReference, paymentNotes)
      await loadOrder()
      onUpdate?.()
      setShowPaymentForm(false)
      setPaymentAmount('')
      setPaymentReference('')
      setPaymentNotes('')
    } catch (error) {
      console.error('Error adding payment:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!order) return
    setIsSaving(true)
    try {
      await updateOrder(order.id, {
        notes: editNotes,
        special_requests: editSpecialRequests
      })
      await loadOrder()
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving notes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const totalPaid = order?.payments?.reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0) || 0
  const pendingAmount = (order?.total || 0) - totalPaid

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-bold text-dark">
              {order?.order_number || 'Cargando...'}
            </h2>
            {order?.customer && (
              <p className="text-dark-light text-sm">
                {order.customer.first_name} {order.customer.last_name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg text-dark-light hover:text-dark transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : order ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-border">
              {[
                { id: 'detail', label: 'Detalle' },
                { id: 'payments', label: 'Pagos' },
                { id: 'history', label: 'Historial' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    'px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                    activeTab === tab.id
                      ? 'text-primary border-primary'
                      : 'text-dark-light border-transparent hover:text-dark'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {activeTab === 'detail' && (
                <div className="space-y-6">
                  {/* Estado y Pago */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Estado del pedido */}
                    <div className="bg-secondary rounded-xl p-4">
                      <h3 className="font-medium text-dark mb-3">Estado del Pedido</h3>
                      {order.status === 'cancelled' ? (
                        <div className="px-3 py-1.5 inline-flex rounded-full text-sm font-medium bg-red-100 text-red-700">
                          Cancelado
                        </div>
                      ) : order.status === 'delivered' ? (
                        <div className="px-3 py-1.5 inline-flex rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 ring-2 ring-offset-2 ring-current">
                          Entregado
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {STATUS_OPTIONS.map(status => {
                            const statusOrder = STATUS_OPTIONS.findIndex(s => s.value === order.status)
                            const targetOrder = STATUS_OPTIONS.findIndex(s => s.value === status.value)
                            const isCurrent = order.status === status.value
                            const isPast = targetOrder < statusOrder
                            const isDisabled = isPast || isSaving

                            return (
                              <button
                                key={status.value}
                                onClick={() => !isCurrent && handleStatusChange(status.value)}
                                disabled={isDisabled}
                                className={cn(
                                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                                  isCurrent
                                    ? `${status.color} ring-2 ring-offset-2 ring-current`
                                    : isPast
                                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                    : 'bg-white text-dark-light hover:bg-gray-100'
                                )}
                              >
                                {status.label}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Resumen de pago */}
                    <div className="bg-secondary rounded-xl p-4">
                      <h3 className="font-medium text-dark mb-3">Estado de Pago</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-dark-light">Total:</span>
                          <span className="font-semibold">{formatCurrency(order.total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-light">Pagado:</span>
                          <span className="font-semibold text-green-600">{formatCurrency(totalPaid)}</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2">
                          <span className="text-dark-light">Pendiente:</span>
                          <span className={cn(
                            'font-bold',
                            pendingAmount > 0 ? 'text-red-600' : 'text-green-600'
                          )}>
                            {formatCurrency(pendingAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info del cliente y entrega */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cliente */}
                    <div>
                      <h3 className="font-medium text-dark mb-3">Cliente</h3>
                      <div className="bg-white border border-border rounded-xl p-4 space-y-2">
                        <p className="font-medium">{order.customer?.first_name} {order.customer?.last_name}</p>
                        <p className="text-sm text-dark-light flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {order.customer?.phone}
                        </p>
                        <p className="text-sm text-dark-light flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {order.customer?.email}
                        </p>
                      </div>
                    </div>

                    {/* Entrega */}
                    <div>
                      <h3 className="font-medium text-dark mb-3">Entrega</h3>
                      <div className="bg-white border border-border rounded-xl p-4 space-y-2">
                        <p className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">
                            {new Date(order.event_date).toLocaleDateString('es-CL', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                          {order.event_time && <span className="text-dark-light">({order.event_time})</span>}
                        </p>
                        <p className="text-sm">
                          <span className={cn(
                            'inline-flex px-2 py-0.5 rounded text-xs font-medium',
                            order.delivery_type === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          )}>
                            {order.delivery_type === 'delivery' ? 'Despacho a domicilio' : 'Retiro en tienda'}
                          </span>
                        </p>
                        {order.delivery_type === 'delivery' && order.delivery_address && (
                          <p className="text-sm text-dark-light">
                            {order.delivery_address}, {order.delivery_city}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items del pedido */}
                  <div>
                    <h3 className="font-medium text-dark mb-3">Servicios</h3>
                    <div className="space-y-4">
                      {order.items.map(item => (
                        <div key={item.id} className="bg-white border border-border rounded-xl p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className={cn(
                                'inline-flex px-2 py-0.5 rounded text-xs font-medium uppercase mb-2',
                                item.service_type === 'torta' ? 'bg-pink-100 text-pink-700' :
                                item.service_type === 'cocteleria' ? 'bg-purple-100 text-purple-700' :
                                'bg-orange-100 text-orange-700'
                              )}>
                                {item.service_type}
                              </span>
                              <p className="font-semibold text-dark">
                                {item.product_name || item.service_type}
                              </p>
                              {item.portions && (
                                <p className="text-sm text-dark-light">{item.portions} porciones</p>
                              )}
                            </div>
                            <p className="font-bold text-primary text-lg">{formatCurrency(item.total_price)}</p>
                          </div>

                          {/* Detalle expandido desde service_data */}
                          {item.service_data && (
                            <ServiceDataDetail serviceData={item.service_data} serviceType={item.service_type} />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Resumen de totales */}
                    <div className="bg-secondary rounded-xl p-4 mt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-dark-light">Subtotal:</span>
                          <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.delivery_fee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-dark-light">Despacho:</span>
                            <span className="font-medium">{formatCurrency(order.delivery_fee)}</span>
                          </div>
                        )}
                        {order.discount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-dark-light">Descuento:</span>
                            <span className="font-medium text-green-600">-{formatCurrency(order.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="font-bold text-dark">Total:</span>
                          <span className="font-bold text-primary text-xl">{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Costos de producción */}
                  {productionCost != null && productionCost > 0 && (
                    <div>
                      <h3 className="font-medium text-dark mb-3">Costos de Producción</h3>
                      <div className="bg-white border border-border rounded-xl p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-dark-light">Costo de producción:</span>
                            <span className="font-medium text-dark">{formatCurrency(productionCost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-light">Ingreso (total pedido):</span>
                            <span className="font-medium">{formatCurrency(order.total)}</span>
                          </div>
                          {(() => {
                            const margin = order.total - productionCost
                            const marginPct = order.total > 0 ? (margin / order.total) * 100 : 0
                            return (
                              <div className="flex justify-between pt-2 border-t border-border">
                                <span className="font-bold text-dark">Margen:</span>
                                <span className={cn('font-bold', margin >= 0 ? 'text-green-600' : 'text-red-600')}>
                                  {formatCurrency(margin)} ({marginPct.toFixed(1)}%)
                                </span>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-dark">Notas</h3>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-sm text-primary hover:text-primary-hover"
                      >
                        {isEditing ? 'Cancelar' : 'Editar'}
                      </button>
                    </div>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-dark-light mb-1">Notas internas</label>
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-dark-light mb-1">Solicitudes especiales</label>
                          <textarea
                            value={editSpecialRequests}
                            onChange={(e) => setEditSpecialRequests(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                            rows={2}
                          />
                        </div>
                        <Button onClick={handleSaveNotes} disabled={isSaving}>
                          {isSaving ? 'Guardando...' : 'Guardar'}
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-white border border-border rounded-xl p-4 space-y-3">
                        {order.notes ? (
                          <div>
                            <p className="text-xs text-dark-light uppercase mb-1">Notas internas</p>
                            <p className="text-dark">{order.notes}</p>
                          </div>
                        ) : null}
                        {order.special_requests ? (
                          <div>
                            <p className="text-xs text-dark-light uppercase mb-1">Solicitudes especiales</p>
                            <p className="text-dark">{order.special_requests}</p>
                          </div>
                        ) : null}
                        {!order.notes && !order.special_requests && (
                          <p className="text-dark-light text-sm">Sin notas</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-6">
                  {/* Botón agregar pago */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-dark-light">
                        Pagado: <span className="font-semibold text-green-600">{formatCurrency(totalPaid)}</span>
                        {' / '}
                        Total: <span className="font-semibold">{formatCurrency(order.total)}</span>
                      </p>
                    </div>
                    {pendingAmount > 0 && (
                      <Button onClick={() => setShowPaymentForm(true)}>
                        + Registrar Pago
                      </Button>
                    )}
                  </div>

                  {/* Formulario de pago */}
                  {showPaymentForm && (
                    <form onSubmit={handleAddPayment} className="bg-secondary rounded-xl p-4 space-y-4">
                      <h4 className="font-medium text-dark">Registrar Pago</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-dark-light mb-1">Monto</label>
                          <input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder={`Pendiente: ${formatCurrency(pendingAmount)}`}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-dark-light mb-1">Método de pago</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            {PAYMENT_METHODS.map(method => (
                              <option key={method.value} value={method.value}>{method.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-dark-light mb-1">Referencia (opcional)</label>
                          <input
                            type="text"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="Nº transferencia, etc."
                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-dark-light mb-1">Notas (opcional)</label>
                          <input
                            type="text"
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isSaving}>
                          {isSaving ? 'Guardando...' : 'Guardar Pago'}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setShowPaymentForm(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Lista de pagos */}
                  <div>
                    <h4 className="font-medium text-dark mb-3">Historial de Pagos</h4>
                    {order.payments.length === 0 ? (
                      <p className="text-dark-light text-center py-8">Sin pagos registrados</p>
                    ) : (
                      <div className="space-y-2">
                        {order.payments.map(payment => (
                          <div key={payment.id} className="bg-white border border-border rounded-lg p-4 flex justify-between items-center">
                            <div>
                              <p className="font-medium text-green-600">{formatCurrency(payment.amount)}</p>
                              <p className="text-sm text-dark-light">
                                {PAYMENT_METHODS.find(m => m.value === payment.payment_method)?.label || payment.payment_method}
                                {payment.reference && ` - ${payment.reference}`}
                              </p>
                              {payment.notes && <p className="text-sm text-dark-light">{payment.notes}</p>}
                            </div>
                            <p className="text-sm text-dark-light">
                              {new Date(payment.created_at).toLocaleDateString('es-CL')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  <h4 className="font-medium text-dark mb-4">Historial de Cambios</h4>
                  {order.history.length === 0 ? (
                    <p className="text-dark-light text-center py-8">Sin historial</p>
                  ) : (
                    <div className="space-y-4">
                      {order.history.map((entry, index) => (
                        <div key={entry.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            {index < order.history.length - 1 && (
                              <div className="w-0.5 flex-1 bg-border"></div>
                            )}
                          </div>
                          <div className="pb-4">
                            <p className="font-medium text-dark">
                              {entry.old_status ? (
                                <>
                                  {ALL_STATUS_LABELS[entry.old_status]?.label || entry.old_status} →{' '}
                                  {ALL_STATUS_LABELS[entry.new_status]?.label || entry.new_status}
                                </>
                              ) : (
                                `Pedido creado (${ALL_STATUS_LABELS[entry.new_status]?.label || entry.new_status})`
                              )}
                            </p>
                            <p className="text-sm text-dark-light">
                              {new Date(entry.created_at).toLocaleString('es-CL')}
                            </p>
                            {entry.notes && <p className="text-sm text-dark mt-1">{entry.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary">
              <div className="flex gap-2">
                {order.status !== 'cancelled' && (
                  <Button
                    variant="secondary"
                    onClick={() => handleStatusChange('cancelled')}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Cancelar Pedido
                  </Button>
                )}
              </div>
              <Button variant="secondary" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-dark-light">
            Pedido no encontrado
          </div>
        )}
      </div>
    </div>
  )
}
