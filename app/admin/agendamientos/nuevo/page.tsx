'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/admin/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { createManualOrder } from '@/lib/supabase/orders-queries'

interface OrderItem {
  id: string
  service_type: string
  product_name: string
  quantity: number
  portions?: number
  unit_price: number
  total_price: number
}

const EVENT_TYPES = [
  'Cumpleaños',
  'Matrimonio',
  'Baby Shower',
  'Bautizo',
  'Comunión',
  'Graduación',
  'Aniversario',
  'Corporativo',
  'Otro',
]

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'mercadopago', label: 'Mercado Pago' },
]

export default function NuevoAgendamientoPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Datos del cliente
  const [customer, setCustomer] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  })

  // Datos del pedido
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('AM')
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup')
  const [notes, setNotes] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  // Items
  const [items, setItems] = useState<OrderItem[]>([])
  const [newItem, setNewItem] = useState({
    product_name: '',
    quantity: 1,
    portions: 0,
    unit_price: 0,
  })

  // Montos
  const [discount, setDiscount] = useState(0)
  const deliveryFee = deliveryType === 'delivery' ? 15000 : 0

  // Pago inicial
  const [hasInitialPayment, setHasInitialPayment] = useState(false)
  const [initialPayment, setInitialPayment] = useState({
    amount: 0,
    payment_method: 'transfer',
    reference: '',
  })

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
  const total = subtotal + deliveryFee - discount

  const addItem = () => {
    if (!newItem.product_name || newItem.unit_price <= 0) return

    const item: OrderItem = {
      id: Date.now().toString(),
      service_type: 'custom',
      product_name: newItem.product_name,
      quantity: newItem.quantity,
      portions: newItem.portions || undefined,
      unit_price: newItem.unit_price,
      total_price: newItem.unit_price * newItem.quantity,
    }

    setItems([...items, item])
    setNewItem({ product_name: '', quantity: 1, portions: 0, unit_price: 0 })
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (!customer.first_name || !customer.last_name || !customer.email || !customer.phone) {
      setError('Completa todos los datos del cliente')
      return
    }

    if (!eventDate) {
      setError('Selecciona una fecha para el pedido')
      return
    }

    if (items.length === 0) {
      setError('Agrega al menos un servicio/producto')
      return
    }

    if (deliveryType === 'delivery' && (!customer.address || !customer.city)) {
      setError('Para delivery, completa la dirección de entrega')
      return
    }

    setIsSubmitting(true)

    try {
      const orderData = {
        customer: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address || undefined,
          city: customer.city || undefined,
        },
        event_type: eventType || 'Otro',
        event_date: eventDate,
        event_time: eventTime,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? customer.address : undefined,
        delivery_city: deliveryType === 'delivery' ? customer.city : undefined,
        items: items.map(item => ({
          service_type: item.service_type,
          product_name: item.product_name,
          quantity: item.quantity,
          portions: item.portions,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        total,
        notes: notes || undefined,
        special_requests: specialRequests || undefined,
        initial_payment: hasInitialPayment && initialPayment.amount > 0
          ? {
              amount: initialPayment.amount,
              payment_method: initialPayment.payment_method,
              reference: initialPayment.reference || undefined,
            }
          : undefined,
      }

      const result = await createManualOrder(orderData)

      router.push(`/admin/agendamientos?created=${result.order_number}`)
    } catch (err) {
      console.error('Error creating order:', err)
      setError('Error al crear el pedido. Intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Nuevo Agendamiento"
        subtitle="Crear pedido manualmente"
      />

      <form onSubmit={handleSubmit} className="p-6 max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Datos del cliente */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-display text-lg font-semibold text-dark mb-4">Datos del Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={customer.first_name}
              onChange={(e) => setCustomer({ ...customer, first_name: e.target.value })}
              required
            />
            <Input
              label="Apellido"
              value={customer.last_name}
              onChange={(e) => setCustomer({ ...customer, last_name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={customer.email}
              onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              required
            />
            <Input
              label="Teléfono"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              placeholder="+56 9 1234 5678"
              required
            />
          </div>
        </div>

        {/* Datos del pedido */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-display text-lg font-semibold text-dark mb-4">Datos del Pedido</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">Tipo de Evento</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-white text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Seleccionar...</option>
                {EVENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <Input
              label="Fecha del Pedido"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-dark mb-2">Horario</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEventTime('AM')}
                  className={cn(
                    'flex-1 py-3 rounded-lg border transition-colors',
                    eventTime === 'AM'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-dark border-border hover:border-primary'
                  )}
                >
                  Mañana (AM)
                </button>
                <button
                  type="button"
                  onClick={() => setEventTime('PM')}
                  className={cn(
                    'flex-1 py-3 rounded-lg border transition-colors',
                    eventTime === 'PM'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-dark border-border hover:border-primary'
                  )}
                >
                  Tarde (PM)
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-2">Tipo de Entrega</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={cn(
                    'flex-1 py-3 rounded-lg border transition-colors',
                    deliveryType === 'pickup'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-dark border-border hover:border-primary'
                  )}
                >
                  Retiro en Tienda
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={cn(
                    'flex-1 py-3 rounded-lg border transition-colors',
                    deliveryType === 'delivery'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-dark border-border hover:border-primary'
                  )}
                >
                  Despacho (+{formatCurrency(15000)})
                </button>
              </div>
            </div>
          </div>

          {deliveryType === 'delivery' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
              <Input
                label="Dirección de Entrega"
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                required
              />
              <Input
                label="Ciudad"
                value={customer.city}
                onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                required
              />
            </div>
          )}
        </div>

        {/* Servicios/Productos */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-display text-lg font-semibold text-dark mb-4">Servicios / Productos</h2>

          {/* Lista de items */}
          {items.length > 0 && (
            <div className="mb-4 space-y-2">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div>
                    <p className="font-medium text-dark">{item.product_name}</p>
                    <p className="text-sm text-dark-light">
                      {item.quantity} x {formatCurrency(item.unit_price)}
                      {item.portions && ` (${item.portions} porciones)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(item.total_price)}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulario para agregar item */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-secondary/50 rounded-lg">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Nombre del producto/servicio"
                value={newItem.product_name}
                onChange={(e) => setNewItem({ ...newItem, product_name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Cantidad"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                min="1"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Precio"
                value={newItem.unit_price || ''}
                onChange={(e) => setNewItem({ ...newItem, unit_price: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <Button type="button" onClick={addItem} className="w-full">
                Agregar
              </Button>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-display text-lg font-semibold text-dark mb-4">Notas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">Notas internas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-white text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={3}
                placeholder="Notas para uso interno..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-2">Solicitudes especiales</label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-white text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={3}
                placeholder="Solicitudes del cliente..."
              />
            </div>
          </div>
        </div>

        {/* Resumen y pago */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-display text-lg font-semibold text-dark mb-4">Resumen</h2>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-dark-light">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-dark-light">Despacho:</span>
                <span className="font-medium">{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-dark-light">Descuento:</span>
              <input
                type="number"
                value={discount || ''}
                onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-24 px-2 py-1 text-right border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex justify-between pt-3 border-t border-border">
              <span className="font-semibold text-dark">Total:</span>
              <span className="font-bold text-xl text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Pago inicial */}
          <div className="pt-4 border-t border-border">
            <label className="flex items-center gap-2 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={hasInitialPayment}
                onChange={(e) => setHasInitialPayment(e.target.checked)}
                className="w-5 h-5 rounded text-primary focus:ring-primary"
              />
              <span className="text-dark">Registrar pago/abono inicial</span>
            </label>

            {hasInitialPayment && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-secondary rounded-lg">
                <div>
                  <label className="block text-sm text-dark-light mb-1">Monto</label>
                  <input
                    type="number"
                    value={initialPayment.amount || ''}
                    onChange={(e) => setInitialPayment({ ...initialPayment, amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-light mb-1">Método</label>
                  <select
                    value={initialPayment.payment_method}
                    onChange={(e) => setInitialPayment({ ...initialPayment, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-dark-light mb-1">Referencia</label>
                  <input
                    type="text"
                    value={initialPayment.reference}
                    onChange={(e) => setInitialPayment({ ...initialPayment, reference: e.target.value })}
                    placeholder="Nº transferencia..."
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-between">
          <Link href="/admin/agendamientos">
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Crear Agendamiento'}
          </Button>
        </div>
      </form>
    </div>
  )
}
