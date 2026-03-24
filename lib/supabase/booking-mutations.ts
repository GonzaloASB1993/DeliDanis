import { createClient } from '@supabase/supabase-js'
import type { BookingData } from '@/stores/bookingStoreMulti'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface CreateBookingResult {
  success: boolean
  orderNumber?: string
  orderId?: string
  error?: string
}

/**
 * Genera un número de orden secuencial
 * Formato: DD-0001, DD-0002, etc.
 */
async function generateOrderNumber(): Promise<string> {
  try {
    const { data } = await supabase
      .from('orders')
      .select('order_number')
      .like('order_number', 'DD-%')
      .order('created_at', { ascending: false })
      .limit(1)

    let nextNumber = 1
    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].order_number.replace('DD-', ''), 10)
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1
      }
    }

    return `DD-${String(nextNumber).padStart(4, '0')}`
  } catch {
    // Fallback si falla la consulta
    const random = String(Math.floor(Math.random() * 9000) + 1000)
    return `DD-${random}`
  }
}

/**
 * Busca o crea un cliente por email
 */
async function findOrCreateCustomer(customerData: BookingData['customer']) {
  // Buscar cliente existente por email
  const { data: existingCustomer, error: searchError } = await supabase
    .from('customers')
    .select('id')
    .eq('email', customerData.email)
    .single()

  if (searchError && searchError.code !== 'PGRST116') {
    // Error diferente a "no encontrado"
    throw new Error(`Error buscando cliente: ${searchError.message}`)
  }

  if (existingCustomer) {
    // Cliente existe, retornar su ID sin sobrescribir datos históricos.
    // La dirección de entrega se almacena en la orden, no en el cliente.
    return existingCustomer.id
  }

  // Cliente no existe, crear nuevo
  const { data: newCustomer, error: createError } = await supabase
    .from('customers')
    .insert({
      email: customerData.email,
      phone: customerData.phone,
      first_name: customerData.firstName,
      last_name: customerData.lastName,
      address: customerData.address || null,
      city: customerData.city || null,
    })
    .select('id')
    .single()

  if (createError || !newCustomer) {
    throw new Error(`Error creando cliente: ${createError?.message}`)
  }

  return newCustomer.id
}

/**
 * Crea un nuevo pedido/agendamiento en la base de datos
 */
export async function createBooking(
  bookingData: BookingData
): Promise<CreateBookingResult> {
  try {
    // Validar que haya servicios
    if (bookingData.services.length === 0) {
      return {
        success: false,
        error: 'No hay servicios en el pedido',
      }
    }

    // Validar fecha del evento
    if (!bookingData.eventDate) {
      return {
        success: false,
        error: 'Falta la fecha del evento',
      }
    }

    // 1. Buscar o crear cliente
    const customerId = await findOrCreateCustomer(bookingData.customer)

    // 2. Generar número de orden secuencial
    const orderNumber = await generateOrderNumber()

    // 3. Crear pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        status: 'pending_payment',
        event_type: bookingData.eventType,
        event_date: bookingData.eventDate.toLocaleDateString('en-CA'), // YYYY-MM-DD in local timezone
        event_time: bookingData.eventTime,
        delivery_type: bookingData.deliveryType,
        delivery_address: bookingData.customer.address || null,
        delivery_city: bookingData.customer.city || null,
        delivery_fee: bookingData.deliveryFee,
        subtotal: bookingData.subtotal,
        discount: 0,
        total: bookingData.total,
        payment_status: 'pending',
      })
      .select('id')
      .single()

    if (orderError || !order) {
      throw new Error(`Error creando pedido: ${orderError?.message}`)
    }

    // 4. Crear items del pedido con nombres descriptivos
    const orderItems = bookingData.services.map((service) => {
      let productName = ''
      let portions = null

      // Extraer nombre del producto según el tipo de servicio
      if (service.type === 'torta') {
        const tortaService = service as any
        productName = tortaService.product?.name || 'Torta'
        portions = tortaService.portions || null
      } else if (service.type === 'cocteleria') {
        const cocktailService = service as any
        if (cocktailService.itemsDetails && cocktailService.itemsDetails.length > 0) {
          // Crear lista de productos
          const items = cocktailService.itemsDetails.map((item: any) =>
            `${item.quantity}x ${item.productName}`
          )
          productName = `Cocteleria: ${items.join(', ')}`
        } else {
          productName = 'Cocteleria para Eventos'
        }
      } else if (service.type === 'pasteleria') {
        const pastryService = service as any
        if (pastryService.itemsDetails && pastryService.itemsDetails.length > 0) {
          // Crear lista de productos
          const items = pastryService.itemsDetails.map((item: any) =>
            `${item.quantity}x ${item.productName}`
          )
          productName = `Pasteleria: ${items.join(', ')}`
        } else {
          productName = 'Pasteleria Artesanal'
        }
      }

      return {
        order_id: order.id,
        service_type: service.type,
        product_name: productName,
        service_data: service, // Guardar toda la estructura del servicio como JSONB
        unit_price: service.price,
        quantity: 1,
        portions,
        total_price: service.price,
      }
    })

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // Si falla la inserción de items, intentar eliminar el pedido creado
      await supabase.from('orders').delete().eq('id', order.id)
      throw new Error(`Error creando items del pedido: ${itemsError.message}`)
    }

    // 5. Retornar resultado exitoso
    return {
      success: true,
      orderNumber,
      orderId: order.id,
    }
  } catch (error) {
    console.error('Error en createBooking:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Obtiene un pedido por su número de orden
 */
export async function getOrderByNumber(orderNumber: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_items(*)
      `)
      .eq('order_number', orderNumber)
      .single()

    if (error) {
      throw new Error(`Error obteniendo pedido: ${error.message}`)
    }

    return { success: true, order: data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Actualiza el estado de un pedido
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  notes?: string
) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) {
      throw new Error(`Error actualizando estado: ${error.message}`)
    }

    // Si hay notas, agregarlas al historial
    if (notes) {
      await supabase.from('order_history').insert({
        order_id: orderId,
        new_status: newStatus,
        notes,
      })
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
