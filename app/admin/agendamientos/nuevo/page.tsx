'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/admin/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { createManualOrder } from '@/lib/supabase/orders-queries'
import {
  getCakeProductsAdmin,
  getPastryProductsAdmin,
  getCocktailProductsAdmin,
} from '@/lib/supabase/catalog-mutations'

interface OrderItem {
  id: string
  service_type: 'torta' | 'pasteleria' | 'cocteleria'
  product_name: string
  product_id: string
  service_data: Record<string, unknown>
  quantity: number
  portions?: number
  unit_price: number
  total_price: number
}

type CategoryType = 'torta' | 'pasteleria' | 'cocteleria'

interface CatalogProduct {
  id: string
  name: string
  base_price: number
  min_portions?: number
  max_portions?: number
  price_per_portion?: number
  min_order_quantity?: number
}

const CATEGORY_TABS: { value: CategoryType; label: string; icon: React.ReactNode }[] = [
  {
    value: 'torta',
    label: 'Tortas',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: 'pasteleria',
    label: 'Pastelería',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: 'cocteleria',
    label: 'Coctelería',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
]

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

const CATEGORY_LABELS: Record<CategoryType, string> = {
  torta: 'Torta',
  pasteleria: 'Pastelería',
  cocteleria: 'Coctelería',
}

const CATEGORY_COLORS: Record<CategoryType, string> = {
  torta: 'bg-primary/10 text-primary',
  pasteleria: 'bg-amber-50 text-amber-700',
  cocteleria: 'bg-blue-50 text-blue-700',
}

function SectionHeader({ step, title, subtitle, icon }: {
  step: number
  title: string
  subtitle?: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">
        {step}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-dark-light">{icon}</span>
        <div>
          <h2 className="font-display text-lg font-semibold text-dark leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-dark-light">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

export default function NuevoAgendamientoPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [itemAdded, setItemAdded] = useState(false)
  const itemsRef = useRef<HTMLDivElement>(null)

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
    quantity: 1,
    portions: 0,
    unit_price: 0,
  })

  // Catalog selector state
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('torta')
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

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

  useEffect(() => {
    let isCancelled = false
    setIsLoadingProducts(true)
    setSelectedProductId('')
    setNewItem(prev => ({ ...prev, unit_price: 0 }))

    const load = async () => {
      try {
        let data: CatalogProduct[] = []
        if (selectedCategory === 'torta') {
          const result = await getCakeProductsAdmin()
          data = result.map((p: any) => ({
            id: p.id,
            name: p.name,
            base_price: p.base_price ?? 0,
            min_portions: p.min_portions ?? 15,
            max_portions: p.max_portions ?? 100,
            price_per_portion: p.price_per_portion ?? 0,
          }))
        } else if (selectedCategory === 'pasteleria') {
          const result = await getPastryProductsAdmin()
          data = result.map((p: any) => ({
            id: p.id,
            name: p.name,
            base_price: p.price ?? 0,
            min_order_quantity: p.min_order_quantity ?? 1,
          }))
        } else {
          const result = await getCocktailProductsAdmin()
          data = result.map((p: any) => ({
            id: p.id,
            name: p.name,
            base_price: p.price ?? 0,
            min_order_quantity: p.min_order_quantity ?? 1,
          }))
        }
        if (!isCancelled) setCatalogProducts(data)
      } catch (err) {
        if (!isCancelled) {
          console.error('Error loading catalog:', err)
          setCatalogProducts([])
        }
      } finally {
        if (!isCancelled) setIsLoadingProducts(false)
      }
    }

    load()
    return () => { isCancelled = true }
  }, [selectedCategory])

  useEffect(() => {
    if (!selectedProductId) return
    const product = catalogProducts.find(p => p.id === selectedProductId)
    if (product) {
      if (selectedCategory === 'torta') {
        const defaultPortions = product.min_portions ?? 15
        setNewItem(prev => ({ ...prev, unit_price: product.base_price, portions: defaultPortions }))
      } else {
        setNewItem(prev => ({ ...prev, unit_price: product.base_price }))
      }
    }
  }, [selectedProductId, catalogProducts, selectedCategory])

  // Auto-calculate torta price when portions change
  useEffect(() => {
    if (selectedCategory !== 'torta' || !selectedProductId) return
    const product = catalogProducts.find(p => p.id === selectedProductId)
    if (!product) return

    const minPortions = product.min_portions ?? 15
    const portions = newItem.portions || minPortions

    let price = product.base_price
    if (portions > minPortions && product.price_per_portion) {
      price = product.base_price + (portions - minPortions) * product.price_per_portion
    }

    setNewItem(prev => prev.unit_price === price ? prev : { ...prev, unit_price: price })
  }, [newItem.portions, selectedProductId, catalogProducts, selectedCategory])

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
  const total = subtotal + deliveryFee - discount

  const selectedProduct = catalogProducts.find(p => p.id === selectedProductId)

  const addItem = () => {
    if (!selectedProductId || newItem.unit_price <= 0) return

    const product = catalogProducts.find(p => p.id === selectedProductId)
    if (!product) return

    let service_data: Record<string, unknown>
    if (selectedCategory === 'torta') {
      service_data = { product: { id: product.id, name: product.name } }
    } else {
      service_data = {
        itemsDetails: [{
          productId: product.id,
          productName: product.name,
          quantity: newItem.quantity,
        }],
      }
    }

    const item: OrderItem = {
      id: Date.now().toString(),
      service_type: selectedCategory,
      product_name: product.name,
      product_id: product.id,
      service_data,
      quantity: newItem.quantity,
      portions: selectedCategory === 'torta' && newItem.portions > 0
        ? newItem.portions
        : undefined,
      unit_price: newItem.unit_price,
      total_price: newItem.unit_price * newItem.quantity,
    }

    setItems([...items, item])
    setSelectedProductId('')
    setNewItem({ quantity: 1, portions: 0, unit_price: 0 })

    setItemAdded(true)
    setTimeout(() => setItemAdded(false), 2000)
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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
          service_data: item.service_data,
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
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header
        title="Nuevo Agendamiento"
        subtitle="Crear pedido manualmente"
      />

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-200 animate-in fade-in slide-in-from-top-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Two-column layout: form left, summary right */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT: Form sections */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* 1. Datos del cliente */}
            <section className="bg-white rounded-xl border border-border p-5 sm:p-6">
              <SectionHeader
                step={1}
                title="Cliente"
                subtitle="Datos de contacto"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </section>

            {/* 2. Datos del pedido */}
            <section className="bg-white rounded-xl border border-border p-5 sm:p-6">
              <SectionHeader
                step={2}
                title="Evento"
                subtitle="Fecha, horario y entrega"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Tipo de Evento</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
                        'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all',
                        eventTime === 'AM'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-dark border-border hover:border-primary/50'
                      )}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventTime('PM')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all',
                        eventTime === 'PM'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-dark border-border hover:border-primary/50'
                      )}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      PM
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
                        'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all text-sm',
                        deliveryType === 'pickup'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-dark border-border hover:border-primary/50'
                      )}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Retiro
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all text-sm',
                        deliveryType === 'delivery'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-dark border-border hover:border-primary/50'
                      )}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                      Despacho
                    </button>
                  </div>
                </div>
              </div>

              {deliveryType === 'delivery' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
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
            </section>

            {/* 3. Servicios/Productos */}
            <section ref={itemsRef} className="bg-white rounded-xl border border-border p-5 sm:p-6">
              <SectionHeader
                step={3}
                title="Productos"
                subtitle="Agrega los servicios del pedido"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                }
              />

              {/* Category tabs */}
              <div className="flex gap-2 mb-4">
                {CATEGORY_TABS.map(tab => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setSelectedCategory(tab.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      selectedCategory === tab.value
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-secondary text-dark-light hover:bg-gray-200'
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Product form */}
              <div className="p-4 bg-secondary/50 rounded-xl border border-border/50 space-y-3">
                {/* Product dropdown */}
                <div>
                  <label className="block text-xs font-medium text-dark-light mb-1.5 uppercase tracking-wide">Producto</label>
                  {isLoadingProducts ? (
                    <div className="w-full px-4 py-3 border border-border rounded-lg text-dark-light text-sm bg-white flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Cargando productos...
                    </div>
                  ) : (
                    <select
                      value={selectedProductId}
                      onChange={e => setSelectedProductId(e.target.value)}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all"
                    >
                      <option value="">Seleccionar producto...</option>
                      {catalogProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatCurrency(p.base_price)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Product pricing info card */}
                {selectedCategory === 'torta' && selectedProduct && (
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-primary/5 rounded-lg border border-primary/10">
                    <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-dark-light">
                      <span className="font-medium text-dark">{formatCurrency(selectedProduct.base_price)}</span>
                      {' '}base ({selectedProduct.min_portions ?? 15} porc. mín.)
                      {selectedProduct.price_per_portion ? (
                        <>
                          {' · '}
                          <span className="font-medium text-dark">+{formatCurrency(selectedProduct.price_per_portion)}</span>
                          {' '}por porción extra
                        </>
                      ) : null}
                    </p>
                  </div>
                )}

                {/* Quantity / Portions / Price row */}
                <div className={cn(
                  'grid gap-3',
                  selectedCategory === 'torta' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
                )}>
                  {selectedCategory === 'torta' ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-dark-light mb-1.5 uppercase tracking-wide">Porciones</label>
                        <input
                          type="number"
                          value={newItem.portions || ''}
                          onChange={e => setNewItem({ ...newItem, portions: parseInt(e.target.value) || 0 })}
                          min={selectedProduct?.min_portions ?? 1}
                          max={selectedProduct?.max_portions ?? 200}
                          placeholder={`Mín. ${selectedProduct?.min_portions ?? 15}`}
                          className="w-full px-4 py-3 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-dark-light mb-1.5 uppercase tracking-wide">Cantidad</label>
                        <input
                          type="number"
                          value={newItem.quantity}
                          onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                          min="1"
                          className="w-full px-4 py-3 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-dark-light mb-1.5 uppercase tracking-wide">Cantidad</label>
                      <input
                        type="number"
                        value={newItem.quantity}
                        onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                        min={selectedProduct?.min_order_quantity ?? 1}
                        placeholder={`Mín. ${selectedProduct?.min_order_quantity ?? 1}`}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-dark-light mb-1.5 uppercase tracking-wide">
                      Precio unitario
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-light text-sm">$</span>
                      <input
                        type="number"
                        value={newItem.unit_price || ''}
                        onChange={e => setNewItem({ ...newItem, unit_price: parseInt(e.target.value) || 0 })}
                        className={cn(
                          'w-full pl-7 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all tabular-nums',
                          selectedCategory === 'torta' && selectedProductId ? 'bg-gray-50' : 'bg-white'
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Add button */}
                <Button
                  type="button"
                  onClick={addItem}
                  disabled={!selectedProductId || newItem.unit_price <= 0}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar al pedido
                </Button>
              </div>

              {/* Success flash */}
              {itemAdded && (
                <div className="mt-3 flex items-center gap-2 text-sm text-success-dark px-3 py-2 bg-success/10 rounded-lg border border-success/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Producto agregado
                </div>
              )}

              {/* Items list */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-dark">
                    Pedido ({items.length} {items.length === 1 ? 'item' : 'items'})
                  </h3>
                  {items.length > 0 && (
                    <span className="text-sm font-medium text-primary tabular-nums">
                      {formatCurrency(subtotal)}
                    </span>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="py-8 px-4 text-center border-2 border-dashed border-border rounded-xl">
                    <svg className="w-10 h-10 mx-auto text-border mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="text-sm text-dark-light">Sin productos agregados</p>
                    <p className="text-xs text-dark-light/70 mt-1">Selecciona un producto arriba para comenzar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-secondary rounded-xl group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={cn(
                              'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider',
                              CATEGORY_COLORS[item.service_type]
                            )}>
                              {CATEGORY_LABELS[item.service_type]}
                            </span>
                            <p className="font-medium text-dark text-sm truncate">{item.product_name}</p>
                          </div>
                          <p className="text-xs text-dark-light tabular-nums">
                            {item.quantity} x {formatCurrency(item.unit_price)}
                            {item.portions ? ` · ${item.portions} porciones` : ''}
                          </p>
                        </div>
                        <span className="font-semibold text-sm text-dark tabular-nums flex-shrink-0">
                          {formatCurrency(item.total_price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-dark-light/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
                          aria-label={`Eliminar ${item.product_name}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* 4. Notas */}
            <section className="bg-white rounded-xl border border-border p-5 sm:p-6">
              <SectionHeader
                step={4}
                title="Notas"
                subtitle="Opcional"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Notas internas</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                    rows={3}
                    placeholder="Notas para uso interno..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Solicitudes del cliente</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                    rows={3}
                    placeholder="Indicaciones especiales..."
                  />
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: Sticky Summary */}
          <div className="lg:w-[360px] flex-shrink-0">
            <div className="lg:sticky lg:top-[72px] space-y-5">
              {/* Resumen */}
              <div className="bg-white rounded-xl border border-border p-5 sm:p-6">
                <h2 className="font-display text-lg font-semibold text-dark mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-dark-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Resumen
                </h2>

                {/* Item count */}
                {items.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-border space-y-1.5">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-dark-light truncate mr-2">
                          {item.quantity}x {item.product_name}
                        </span>
                        <span className="text-dark tabular-nums flex-shrink-0">{formatCurrency(item.total_price)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-light">Subtotal</span>
                    <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-light">Despacho</span>
                      <span className="font-medium tabular-nums">{formatCurrency(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-dark-light">Descuento</span>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-dark-light text-xs">$</span>
                      <input
                        type="number"
                        value={discount || ''}
                        onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 pl-5 pr-2 py-1.5 text-right text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 tabular-nums"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <span className="font-semibold text-dark">Total</span>
                    <span className="font-bold text-xl text-primary tabular-nums">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Pago inicial */}
              <div className="bg-white rounded-xl border border-border p-5 sm:p-6">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasInitialPayment}
                    onChange={(e) => setHasInitialPayment(e.target.checked)}
                    className="w-4.5 h-4.5 rounded text-primary focus:ring-primary border-border"
                  />
                  <span className="text-sm font-medium text-dark">Registrar pago/abono</span>
                </label>

                {hasInitialPayment && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-dark-light mb-1.5 uppercase tracking-wide">Monto</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-light text-sm">$</span>
                        <input
                          type="number"
                          value={initialPayment.amount || ''}
                          onChange={(e) => setInitialPayment({ ...initialPayment, amount: parseInt(e.target.value) || 0 })}
                          className="w-full pl-7 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm tabular-nums"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-dark-light mb-1.5 uppercase tracking-wide">Método</label>
                      <select
                        value={initialPayment.payment_method}
                        onChange={(e) => setInitialPayment({ ...initialPayment, payment_method: e.target.value })}
                        className="w-full px-3 py-2.5 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                      >
                        {PAYMENT_METHODS.map(method => (
                          <option key={method.value} value={method.value}>{method.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-dark-light mb-1.5 uppercase tracking-wide">Referencia</label>
                      <input
                        type="text"
                        value={initialPayment.reference}
                        onChange={(e) => setInitialPayment({ ...initialPayment, reference: e.target.value })}
                        placeholder="N. transferencia..."
                        className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                <Button type="submit" isLoading={isSubmitting} className="w-full">
                  Crear Agendamiento
                </Button>
                <Link href="/admin/agendamientos" className="w-full">
                  <Button type="button" variant="ghost" className="w-full">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
