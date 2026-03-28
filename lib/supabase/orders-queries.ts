import { supabase } from './client'

// Tipos
export interface OrderWithDetails {
  id: string
  order_number: string
  status: string
  payment_status: string
  event_type: string | null
  event_date: string
  event_time: string | null
  delivery_type: string
  delivery_address: string | null
  delivery_city: string | null
  delivery_fee: number
  subtotal: number
  discount: number
  total: number
  deposit_amount: number
  deposit_paid: boolean
  notes: string | null
  special_requests: string | null
  created_at: string
  updated_at: string
  customer: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    address: string | null
    city: string | null
  } | null
  items: OrderItemDetail[]
  payments: OrderPayment[]
  history: OrderHistoryEntry[]
}

export interface OrderItemDetail {
  id: string
  service_type: string
  product_name: string | null
  service_data: Record<string, unknown>
  unit_price: number
  quantity: number
  portions: number | null
  total_price: number
}

export interface OrderPayment {
  id: string
  amount: number
  payment_method: string
  reference: string | null
  notes: string | null
  created_at: string
  created_by: string | null
}

export interface OrderHistoryEntry {
  id: string
  old_status: string | null
  new_status: string
  notes: string | null
  created_at: string
  created_by: string | null
}

// Obtener lista de pedidos con filtros
export async function getOrders(filters: {
  month?: number
  year?: number
  status?: string
  paymentStatus?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const { month, year, status, paymentStatus, search, limit = 50, offset = 0 } = filters

  let query = supabase
    .from('orders')
    .select(`
      *,
      customers (
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      order_items (
        id,
        service_type,
        product_name,
        quantity,
        portions,
        total_price
      )
    `)
    .order('event_date', { ascending: true })
    .range(offset, offset + limit - 1)

  // Filtro por mes/año
  if (month && year) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    query = query.gte('event_date', startDate).lte('event_date', endDate)
  }

  // Filtro por estado — 'pending' incluye 'pending_payment' (mismo estado visual)
  if (status && status !== 'all') {
    if (status === 'pending') {
      query = query.in('status', ['pending', 'pending_payment'])
    } else {
      query = query.eq('status', status)
    }
  }

  // Filtro por estado de pago
  if (paymentStatus && paymentStatus !== 'all') {
    query = query.eq('payment_status', paymentStatus)
  }

  const { data, error } = await query

  if (error) throw error

  // Filtro de búsqueda en cliente
  let filtered = data || []
  if (search) {
    const searchLower = search.toLowerCase()
    filtered = filtered.filter(order => {
      const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers
      if (!customer) return false
      const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase()
      return (
        fullName.includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.includes(search)
      )
    })
  }

  return filtered.map(order => {
    const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers
    return {
      ...order,
      customer,
      items: order.order_items || []
    }
  })
}

// Obtener detalle de un pedido
export async function getOrderById(orderId: string): Promise<OrderWithDetails | null> {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (
        id,
        first_name,
        last_name,
        email,
        phone,
        address,
        city
      ),
      order_items (
        id,
        service_type,
        product_name,
        service_data,
        unit_price,
        quantity,
        portions,
        total_price
      ),
      order_payments (
        id,
        amount,
        payment_method,
        reference,
        notes,
        created_at,
        created_by
      ),
      order_history (
        id,
        old_status,
        new_status,
        notes,
        created_at,
        created_by
      )
    `)
    .eq('id', orderId)
    .single()

  if (error) {
    console.error('Error fetching order:', error)
    return null
  }

  if (!order) return null

  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers

  return {
    ...order,
    customer,
    items: order.order_items || [],
    payments: order.order_payments || [],
    history: (order.order_history || []).sort(
      (a: OrderHistoryEntry, b: OrderHistoryEntry) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } as OrderWithDetails
}

// Buscar pedido por número de orden (para seguimiento público)
export async function getOrderByNumber(orderNumber: string): Promise<OrderWithDetails | null> {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (
        id,
        first_name,
        last_name,
        email,
        phone,
        address,
        city
      ),
      order_items (
        id,
        service_type,
        product_name,
        service_data,
        unit_price,
        quantity,
        portions,
        total_price
      ),
      order_payments (
        id,
        amount,
        payment_method,
        reference,
        notes,
        created_at,
        created_by
      ),
      order_history (
        id,
        old_status,
        new_status,
        notes,
        created_at,
        created_by
      )
    `)
    .eq('order_number', orderNumber.toUpperCase())
    .single()

  if (error || !order) return null

  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers

  return {
    ...order,
    customer,
    items: order.order_items || [],
    payments: order.order_payments || [],
    history: (order.order_history || []).sort(
      (a: OrderHistoryEntry, b: OrderHistoryEntry) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } as OrderWithDetails
}

// Actualizar estado del pedido
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  notes?: string,
  userId?: string
) {
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)

  if (error) throw error

  // Agregar nota al historial si hay
  if (notes) {
    await supabase
      .from('order_history')
      .update({ notes })
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
  }

  return { success: true }
}

// Agregar pago/abono
export async function addPayment(
  orderId: string,
  amount: number,
  paymentMethod: string,
  reference?: string,
  notes?: string,
  userId?: string
) {
  const { data, error } = await supabase
    .from('order_payments')
    .insert({
      order_id: orderId,
      amount,
      payment_method: paymentMethod,
      reference,
      notes,
      created_by: userId
    })
    .select()
    .single()

  if (error) throw error

  return data
}

// Obtener total pagado de un pedido
export async function getOrderPaidAmount(orderId: string): Promise<number> {
  const { data, error } = await supabase
    .from('order_payments')
    .select('amount')
    .eq('order_id', orderId)

  if (error) {
    console.error('Error fetching payments:', error)
    return 0
  }

  return data?.reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0) || 0
}

// Actualizar pedido
export async function updateOrder(
  orderId: string,
  updates: {
    event_date?: string
    event_time?: string
    delivery_type?: string
    delivery_address?: string
    delivery_city?: string
    notes?: string
    special_requests?: string
    discount?: number
  }
) {
  // Recalcular total si hay descuento
  let updateData: Record<string, unknown> = { ...updates }

  if (updates.discount !== undefined) {
    const { data: order } = await supabase
      .from('orders')
      .select('subtotal, delivery_fee')
      .eq('id', orderId)
      .single()

    if (order) {
      const subtotal = parseFloat(String(order.subtotal)) || 0
      const deliveryFee = parseFloat(String(order.delivery_fee)) || 0
      updateData.total = subtotal + deliveryFee - updates.discount
    }
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)

  if (error) throw error

  return { success: true }
}

// Cancelar pedido
export async function cancelOrder(orderId: string, notes?: string) {
  return updateOrderStatus(orderId, 'cancelled', notes)
}

// Obtener estadísticas de pedidos para un período
export async function getOrderStats(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data: orders, error } = await supabase
    .from('orders')
    .select('status, payment_status, total, deposit_amount, deposit_paid')
    .gte('event_date', startDate)
    .lte('event_date', endDate)

  if (error) throw error

  const stats = {
    pending: 0,
    confirmed: 0,
    in_production: 0,
    ready: 0,
    delivered: 0,
    completed: 0,
    cancelled: 0,
    total: orders?.length || 0,
    totalAmount: 0,
    totalPaid: 0,
    totalPending: 0
  }

  orders?.forEach(order => {
    // Conteo por estado
    if (order.status in stats) {
      stats[order.status as keyof typeof stats]++
    }

    const orderTotal = parseFloat(String(order.total)) || 0
    stats.totalAmount += orderTotal

    if (order.payment_status === 'paid') {
      stats.totalPaid += orderTotal
    } else if (order.deposit_paid) {
      stats.totalPaid += parseFloat(String(order.deposit_amount)) || 0
    }
  })

  stats.totalPending = stats.totalAmount - stats.totalPaid

  return stats
}

// Crear pedido manualmente
export async function createManualOrder(orderData: {
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string
    address?: string
    city?: string
  }
  event_type: string
  event_date: string
  event_time: string
  delivery_type: 'pickup' | 'delivery'
  delivery_address?: string
  delivery_city?: string
  items: {
    service_type: string
    product_name: string
    quantity: number
    portions?: number
    unit_price: number
    total_price: number
    service_data?: Record<string, unknown>
  }[]
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  notes?: string
  special_requests?: string
  initial_payment?: {
    amount: number
    payment_method: string
    reference?: string
  }
}) {
  // 1. Buscar o crear cliente
  let customerId: string

  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('email', orderData.customer.email)
    .single()

  if (existingCustomer) {
    customerId = existingCustomer.id
    // Actualizar datos del cliente
    await supabase
      .from('customers')
      .update({
        first_name: orderData.customer.first_name,
        last_name: orderData.customer.last_name,
        phone: orderData.customer.phone,
        address: orderData.customer.address,
        city: orderData.customer.city
      })
      .eq('id', customerId)
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert(orderData.customer)
      .select('id')
      .single()

    if (customerError) throw customerError
    customerId = newCustomer.id
  }

  // 2. Generar número de orden secuencial
  let nextNumber = 1
  const { data: lastOrder } = await supabase
    .from('orders')
    .select('order_number')
    .like('order_number', 'DD-%')
    .order('created_at', { ascending: false })
    .limit(1)

  if (lastOrder && lastOrder.length > 0) {
    const lastNum = parseInt(lastOrder[0].order_number.replace('DD-', ''), 10)
    if (!isNaN(lastNum)) nextNumber = lastNum + 1
  }
  const orderNumber = `DD-${String(nextNumber).padStart(4, '0')}`

  // 3. Crear el pedido
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_id: customerId,
      status: 'pending',
      event_type: orderData.event_type,
      event_date: orderData.event_date,
      event_time: orderData.event_time,
      delivery_type: orderData.delivery_type,
      delivery_address: orderData.delivery_address,
      delivery_city: orderData.delivery_city,
      delivery_fee: orderData.delivery_fee,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      total: orderData.total,
      notes: orderData.notes,
      special_requests: orderData.special_requests,
      payment_status: 'pending'
    })
    .select('id, order_number')
    .single()

  if (orderError) throw orderError

  // 4. Crear items del pedido
  const itemsToInsert = orderData.items.map(item => ({
    order_id: order.id,
    service_type: item.service_type,
    product_name: item.product_name,
    quantity: item.quantity,
    portions: item.portions,
    unit_price: item.unit_price,
    total_price: item.total_price,
    service_data: item.service_data || {}
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsToInsert)

  if (itemsError) throw itemsError

  // 5. Registrar pago inicial si existe
  if (orderData.initial_payment && orderData.initial_payment.amount > 0) {
    await addPayment(
      order.id,
      orderData.initial_payment.amount,
      orderData.initial_payment.payment_method,
      orderData.initial_payment.reference
    )
  }

  // 6. Actualizar estadísticas del cliente
  await supabase.rpc('calculate_customer_stats', { customer_uuid: customerId })

  return order
}
