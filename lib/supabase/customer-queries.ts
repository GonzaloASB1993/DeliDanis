import { supabase } from './client'

// ============ Types ============

export interface Customer {
  id: string
  user_id: string | null
  email: string
  phone: string | null
  first_name: string | null
  last_name: string | null
  address: string | null
  city: string | null
  notes: string | null
  tags: string[]
  birthday: string | null
  total_orders: number
  total_spent: number
  created_at: string
  updated_at: string
}

export interface CustomerOrder {
  id: string
  order_number: string
  customer_id: string
  status: string
  event_date: string
  event_time: string | null
  delivery_date: string
  total: number
  payment_status: string
  event_type: string | null
  created_at: string
}

export interface CustomerWithOrders extends Customer {
  orders: CustomerOrder[]
}

export interface CustomerFilters {
  search?: string
  tag?: string
  sortBy?: 'name' | 'total_spent' | 'total_orders' | 'created_at'
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface CustomerStats {
  totalCustomers: number
  newThisMonth: number
  totalRevenue: number
  averagePerCustomer: number
}

export type CustomerFormData = {
  email: string
  phone?: string
  first_name?: string
  last_name?: string
  address?: string
  city?: string
  notes?: string
  tags?: string[]
  birthday?: string
}

// ============ Queries ============

export async function getCustomers(
  filters: CustomerFilters = {}
): Promise<{ data: Customer[]; count: number }> {
  const {
    search,
    tag,
    sortBy = 'created_at',
    sortDir = 'desc',
    page = 1,
    pageSize = 20,
  } = filters

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .order(sortBy === 'name' ? 'first_name' : sortBy, { ascending: sortDir === 'asc' })
    .range(from, to)

  if (search) {
    const term = search.trim()
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`
    )
  }

  if (tag) {
    query = query.contains('tags', [tag])
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching customers:', error)
    return { data: [], count: 0 }
  }

  const customers = data || []

  // Compute total_orders and total_spent from orders (static columns are never updated)
  const { data: orderRows } = await supabase
    .from('orders')
    .select('customer_id, total')
    .neq('status', 'cancelled')

  const stats: Record<string, { count: number; total: number }> = {}
  for (const o of orderRows ?? []) {
    if (!o.customer_id) continue
    if (!stats[o.customer_id]) stats[o.customer_id] = { count: 0, total: 0 }
    stats[o.customer_id].count++
    stats[o.customer_id].total += parseFloat(o.total) || 0
  }

  const enriched = customers.map(c => ({
    ...c,
    total_orders: stats[c.id]?.count ?? 0,
    total_spent: stats[c.id]?.total ?? 0,
  }))

  // JS sort for total_orders / total_spent (can't use PostgREST .order() on computed values)
  // NOTE: JS sort only re-orders the current page (pagination already applied above)
  if (sortBy === 'total_spent' || sortBy === 'total_orders') {
    enriched.sort((a, b) => {
      const valA = sortBy === 'total_spent' ? a.total_spent : a.total_orders
      const valB = sortBy === 'total_spent' ? b.total_spent : b.total_orders
      return sortDir === 'asc' ? valA - valB : valB - valA
    })
  }

  return { data: enriched, count: count || 0 }
}

export async function getCustomerById(id: string): Promise<CustomerWithOrders | null> {
  const [customerRes, ordersRes] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).single(),
    supabase
      .from('orders')
      .select('id, order_number, customer_id, status, event_date, event_time, delivery_date, total, payment_status, event_type, created_at')
      .eq('customer_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (customerRes.error) {
    console.error('Error fetching customer:', customerRes.error)
    return null
  }

  return {
    ...customerRes.data,
    orders: ordersRes.data || [],
  }
}

export async function createCustomer(data: CustomerFormData): Promise<Customer | null> {
  const { data: created, error } = await supabase
    .from('customers')
    .insert({
      email: data.email,
      phone: data.phone || null,
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      address: data.address || null,
      city: data.city || null,
      notes: data.notes || null,
      tags: data.tags || [],
      birthday: data.birthday || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating customer:', error)
    return null
  }

  return created
}

export async function updateCustomer(
  id: string,
  data: Partial<CustomerFormData>
): Promise<boolean> {
  const { error } = await supabase
    .from('customers')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating customer:', error)
    return false
  }

  return true
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const { error } = await supabase.from('customers').delete().eq('id', id)

  if (error) {
    console.error('Error deleting customer:', error)
    return false
  }

  return true
}

export async function getCustomerStats(): Promise<CustomerStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [totalRes, newRes, ordersRes] = await Promise.all([
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfMonth),
    supabase.from('orders').select('total').neq('status', 'cancelled'),
  ])

  const totalCustomers = totalRes.count || 0
  const newThisMonth = newRes.count || 0
  const totalRevenue = (ordersRes.data || []).reduce(
    (sum, o) => sum + (parseFloat(o.total) || 0),
    0
  )
  const averagePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

  return { totalCustomers, newThisMonth, totalRevenue, averagePerCustomer }
}

export async function getCustomerTags(): Promise<string[]> {
  const { data, error } = await supabase.from('customers').select('tags')

  if (error) {
    console.error('Error fetching tags:', error)
    return []
  }

  const tagSet = new Set<string>()
  ;(data || []).forEach((row) => {
    ;(row.tags || []).forEach((tag: string) => {
      if (tag) tagSet.add(tag)
    })
  })

  return Array.from(tagSet).sort()
}

export async function addCustomerTag(id: string, tag: string): Promise<boolean> {
  // Fetch current tags first
  const { data, error: fetchError } = await supabase
    .from('customers')
    .select('tags')
    .eq('id', id)
    .single()

  if (fetchError || !data) {
    console.error('Error fetching customer tags:', fetchError)
    return false
  }

  const currentTags: string[] = data.tags || []
  if (currentTags.includes(tag)) return true

  const { error } = await supabase
    .from('customers')
    .update({ tags: [...currentTags, tag], updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error adding tag:', error)
    return false
  }

  return true
}

export async function removeCustomerTag(id: string, tag: string): Promise<boolean> {
  const { data, error: fetchError } = await supabase
    .from('customers')
    .select('tags')
    .eq('id', id)
    .single()

  if (fetchError || !data) {
    console.error('Error fetching customer tags:', fetchError)
    return false
  }

  const updatedTags = (data.tags || []).filter((t: string) => t !== tag)

  const { error } = await supabase
    .from('customers')
    .update({ tags: updatedTags, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error removing tag:', error)
    return false
  }

  return true
}
