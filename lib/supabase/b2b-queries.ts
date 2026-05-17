import { supabase } from './client'
import type {
  B2BProduct,
  B2BOrderSummary,
  B2BOrderDetail,
  B2BOrderItem,
  B2BPrice,
} from '@/types/b2b'

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function getB2BProducts(): Promise<B2BProduct[]> {
  try {
    // 1. Fetch all active B2B prices
    const { data: prices, error: pricesError } = await supabase
      .from('b2b_prices')
      .select('*')
      .eq('is_active', true)

    if (pricesError) {
      console.error('getB2BProducts – prices error:', pricesError)
      return []
    }

    if (!prices || prices.length === 0) return []

    // Group price records by product type
    const byType: Record<string, typeof prices> = { cake: [], pastry: [], cocktail: [] }
    for (const p of prices) {
      byType[p.product_type]?.push(p)
    }

    const results: B2BProduct[] = []

    // 2. Fetch from each product table
    const tableMap: Record<string, { table: string; categoryTable: string }> = {
      cake: { table: 'cake_products', categoryTable: 'cake_categories' },
      pastry: { table: 'pastry_products', categoryTable: 'pastry_categories' },
      cocktail: { table: 'cocktail_products', categoryTable: 'cocktail_categories' },
    }

    for (const [productType, priceRecords] of Object.entries(byType)) {
      if (priceRecords.length === 0) continue

      const ids = priceRecords.map((p) => p.product_id)
      const { table, categoryTable } = tableMap[productType]

      const { data: products, error: productsError } = await supabase
        .from(table)
        .select(`id, name, slug, description, short_description, image_url, is_active, category:${categoryTable}(name)`)
        .in('id', ids)
        .eq('is_active', true)

      if (productsError) {
        console.error(`getB2BProducts – ${table} error:`, productsError)
        continue
      }

      if (!products) continue

      // Build a lookup map for prices
      const priceMap = new Map<string, (typeof priceRecords)[number]>()
      for (const pr of priceRecords) {
        priceMap.set(pr.product_id, pr)
      }

      for (const product of products) {
        const priceRecord = priceMap.get(product.id)
        if (!priceRecord) continue

        // Supabase returns joined tables as an object or array; normalise here
        const categoryRow = product.category as { name: string } | { name: string }[] | null
        const categoryName = Array.isArray(categoryRow)
          ? (categoryRow[0]?.name ?? null)
          : (categoryRow?.name ?? null)

        results.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description ?? null,
          short_description: product.short_description ?? null,
          product_type: productType as 'cake' | 'pastry' | 'cocktail',
          category_name: categoryName,
          image_url: product.image_url ?? null,
          b2b_price: priceRecord.price,
          min_quantity: priceRecord.min_quantity,
          is_active: product.is_active,
        })
      }
    }

    return results
  } catch (err) {
    console.error('getB2BProducts – unexpected error:', err)
    return []
  }
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export async function getB2BCustomer() {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('getB2BCustomer – auth error:', authError)
      return null
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'business')
      .single()

    if (error) {
      console.error('getB2BCustomer – query error:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('getB2BCustomer – unexpected error:', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Orders – create
// ---------------------------------------------------------------------------

interface CreateB2BOrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export async function createB2BOrder(
  customerId: string,
  items: CreateB2BOrderItem[]
): Promise<{ success: boolean; data?: { id: string; order_number: string }; error?: string }> {
  try {
    const orderNumber = `B2B-${Date.now().toString(36).toUpperCase()}`

    const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)
    const total = subtotal

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        channel: 'b2b',
        event_type: 'b2b_order',
        delivery_type: 'pickup',
        status: 'pending',
        payment_status: 'pending',
        subtotal,
        discount: 0,
        total,
      })
      .select('id, order_number')
      .single()

    if (orderError || !order) {
      console.error('createB2BOrder – order insert error:', orderError)
      return { success: false, error: orderError?.message ?? 'Failed to create order' }
    }

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.unitPrice * item.quantity,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      console.error('createB2BOrder – items insert error:', itemsError)
      return { success: false, error: itemsError.message }
    }

    return { success: true, data: order }
  } catch (err) {
    console.error('createB2BOrder – unexpected error:', err)
    return { success: false, error: 'Unexpected error' }
  }
}

// ---------------------------------------------------------------------------
// Orders – list
// ---------------------------------------------------------------------------

export async function getB2BOrders(): Promise<B2BOrderSummary[]> {
  try {
    const customer = await getB2BCustomer()
    if (!customer) return []

    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, status, total, created_at, order_items(id)')
      .eq('customer_id', customer.id)
      .eq('channel', 'b2b')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getB2BOrders – query error:', error)
      return []
    }

    return (data ?? []).map((order) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      total: order.total,
      item_count: Array.isArray(order.order_items) ? order.order_items.length : 0,
      created_at: order.created_at,
    }))
  } catch (err) {
    console.error('getB2BOrders – unexpected error:', err)
    return []
  }
}

// ---------------------------------------------------------------------------
// Orders – detail
// ---------------------------------------------------------------------------

export async function getB2BOrderDetail(orderId: string): Promise<B2BOrderDetail | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        subtotal,
        total,
        created_at,
        order_items (
          id,
          product_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('id', orderId)
      .eq('channel', 'b2b')
      .single()

    if (error || !data) {
      console.error('getB2BOrderDetail – query error:', error)
      return null
    }

    const rawItems = (data.order_items ?? []) as Array<{
      id: string
      product_name: string
      quantity: number
      unit_price: number
      total_price: number
    }>

    const items: B2BOrderItem[] = rawItems.map((item) => ({
      id: item.id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    return {
      id: data.id,
      order_number: data.order_number,
      status: data.status,
      subtotal: data.subtotal,
      total: data.total,
      created_at: data.created_at,
      items,
    }
  } catch (err) {
    console.error('getB2BOrderDetail – unexpected error:', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Orders – repeat (get items from a previous order)
// ---------------------------------------------------------------------------

export async function getOrderItemsForRepeat(orderId: string): Promise<B2BOrderItem[]> {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('id, product_name, quantity, unit_price, total_price')
      .eq('order_id', orderId)

    if (error) {
      console.error('getOrderItemsForRepeat – query error:', error)
      return []
    }

    return (data ?? []).map((item) => ({
      id: item.id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))
  } catch (err) {
    console.error('getOrderItemsForRepeat – unexpected error:', err)
    return []
  }
}

// ---------------------------------------------------------------------------
// B2B Prices – admin helpers
// ---------------------------------------------------------------------------

export async function getB2BPrice(
  productId: string,
  productType: 'cake' | 'pastry' | 'cocktail'
): Promise<B2BPrice | null> {
  try {
    const { data, error } = await supabase
      .from('b2b_prices')
      .select('*')
      .eq('product_id', productId)
      .eq('product_type', productType)
      .single()

    if (error) {
      console.error('getB2BPrice – query error:', error)
      return null
    }

    return data as B2BPrice
  } catch (err) {
    console.error('getB2BPrice – unexpected error:', err)
    return null
  }
}

export async function upsertB2BPrice(
  productId: string,
  productType: 'cake' | 'pastry' | 'cocktail',
  price: number,
  minQuantity: number,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('b2b_prices').upsert(
      {
        product_id: productId,
        product_type: productType,
        price,
        min_quantity: minQuantity,
        is_active: isActive,
      },
      { onConflict: 'product_id,product_type' }
    )

    if (error) {
      console.error('upsertB2BPrice – error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('upsertB2BPrice – unexpected error:', err)
    return { success: false, error: 'Unexpected error' }
  }
}

export async function deleteB2BPrice(
  productId: string,
  productType: 'cake' | 'pastry' | 'cocktail'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('b2b_prices')
      .delete()
      .eq('product_id', productId)
      .eq('product_type', productType)

    if (error) {
      console.error('deleteB2BPrice – error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('deleteB2BPrice – unexpected error:', err)
    return { success: false, error: 'Unexpected error' }
  }
}
