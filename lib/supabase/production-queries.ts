import { supabase } from './client'
import { createMovement, getRecipesByProduct, type RecipeItem } from './inventory-queries'
import { updateOrderStatus } from './orders-queries'

// ============ Types ============

export interface NutritionalInfo {
  calories: number
  protein: number
  fat: number
  saturated_fat: number
  carbohydrates: number
  sugar: number
  fiber: number
  sodium: number
}

export interface ProductionOrder {
  id: string
  order_id: string | null
  product_id: string
  product_type: 'cake' | 'cocktail' | 'pastry'
  product_name: string
  quantity: number
  sku: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  started_at: string | null
  completed_at: string | null
  notes: string | null
  nutritional_info: NutritionalInfo | null
  created_by: string | null
  created_at: string
  order?: {
    order_number: string
    event_date: string
    status: string
  } | null
  movements?: ProductionMovement[]
}

export interface ProductionMovement {
  id: string
  production_order_id: string
  ingredient_id: string
  planned_quantity: number
  actual_quantity: number | null
  waste_quantity: number
  movement_id: string | null
  waste_movement_id: string | null
  created_at: string
  ingredient?: {
    id: string
    name: string
    unit: string
    current_stock: number
    unit_cost: number
    calories: number
    protein: number
    fat: number
    saturated_fat: number
    carbohydrates: number
    sugar: number
    fiber: number
    sodium: number
  }
}

export interface ProductionFilters {
  status?: string
  hasOrder?: boolean
  dateFrom?: string
  dateTo?: string
  search?: string
  productType?: 'cake' | 'cocktail' | 'pastry'
  sortBy?: 'product_name' | 'created_at' | 'event_date' | 'status'
  sortDir?: 'asc' | 'desc'
  eventDateFrom?: string
  eventDateTo?: string
}

export type ViewMode = 'kanban' | 'list' | 'timeline'

// ============ SKU Generation ============

export async function generateSKU(productType: 'cake' | 'cocktail' | 'pastry'): Promise<string> {
  const typeCodeMap = { cake: 'CAK', cocktail: 'COC', pastry: 'PAS' }
  const typeCode = typeCodeMap[productType]
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')

  const { data, error } = await supabase.rpc('get_next_sku_sequence', {
    type_code: typeCode,
    date_str: dateStr,
  })

  if (error) {
    console.error('Error generating SKU:', error)
    // Fallback: use timestamp
    return `DD-${typeCode}-${dateStr}-${Date.now().toString().slice(-3)}`
  }

  const seq = String(data).padStart(3, '0')
  return `DD-${typeCode}-${dateStr}-${seq}`
}

// ============ Nutritional Calculation ============

export function calculateNutritionalInfo(
  movements: Array<{
    planned_quantity: number
    ingredient?: {
      calories: number
      protein: number
      fat: number
      saturated_fat: number
      carbohydrates: number
      sugar: number
      fiber: number
      sodium: number
    } | null
  }>
): NutritionalInfo {
  const totals: NutritionalInfo = {
    calories: 0,
    protein: 0,
    fat: 0,
    saturated_fat: 0,
    carbohydrates: 0,
    sugar: 0,
    fiber: 0,
    sodium: 0,
  }

  let totalWeight = 0

  for (const mov of movements) {
    if (!mov.ingredient) continue
    // Nutritional values are per 100g/ml, quantity_needed is in the ingredient's unit
    const factor = mov.planned_quantity / 100
    totalWeight += mov.planned_quantity

    totals.calories += mov.ingredient.calories * factor
    totals.protein += mov.ingredient.protein * factor
    totals.fat += mov.ingredient.fat * factor
    totals.saturated_fat += mov.ingredient.saturated_fat * factor
    totals.carbohydrates += mov.ingredient.carbohydrates * factor
    totals.sugar += mov.ingredient.sugar * factor
    totals.fiber += mov.ingredient.fiber * factor
    totals.sodium += mov.ingredient.sodium * factor
  }

  // Normalize to per 100g of the final product
  if (totalWeight > 0) {
    const normFactor = 100 / totalWeight
    totals.calories = Math.round(totals.calories * normFactor * 100) / 100
    totals.protein = Math.round(totals.protein * normFactor * 100) / 100
    totals.fat = Math.round(totals.fat * normFactor * 100) / 100
    totals.saturated_fat = Math.round(totals.saturated_fat * normFactor * 100) / 100
    totals.carbohydrates = Math.round(totals.carbohydrates * normFactor * 100) / 100
    totals.sugar = Math.round(totals.sugar * normFactor * 100) / 100
    totals.fiber = Math.round(totals.fiber * normFactor * 100) / 100
    totals.sodium = Math.round(totals.sodium * normFactor * 100) / 100
  }

  return totals
}

// ============ CRUD ============

export async function getProductionOrders(filters: ProductionFilters = {}): Promise<ProductionOrder[]> {
  let query = supabase
    .from('production_orders')
    .select(`
      *,
      order:orders(order_number, event_date, status)
    `)

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.productType) {
    query = query.eq('product_type', filters.productType)
  }

  if (filters.hasOrder === true) {
    query = query.not('order_id', 'is', null)
  } else if (filters.hasOrder === false) {
    query = query.is('order_id', null)
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo + 'T23:59:59')
  }

  if (filters.search) {
    query = query.or(`product_name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
  }

  // Sort
  const sortBy = filters.sortBy || 'created_at'
  const ascending = filters.sortDir === 'asc'
  query = query.order(sortBy, { ascending })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching production orders:', error)
    return []
  }

  let results = data || []

  // Client-side filter by event_date range (from the joined order)
  if (filters.eventDateFrom || filters.eventDateTo) {
    results = results.filter(o => {
      const eventDate = o.order?.event_date
      if (!eventDate) return false
      if (filters.eventDateFrom && eventDate < filters.eventDateFrom) return false
      if (filters.eventDateTo && eventDate > filters.eventDateTo) return false
      return true
    })
  }

  // Client-side search for order_number (joined field)
  if (filters.search) {
    const term = filters.search.toLowerCase()
    results = results.filter(o =>
      o.product_name.toLowerCase().includes(term) ||
      o.sku.toLowerCase().includes(term) ||
      (o.order?.order_number?.toLowerCase().includes(term))
    )
  }

  return results
}

export async function getProductionOrderById(id: string): Promise<ProductionOrder | null> {
  const { data, error } = await supabase
    .from('production_orders')
    .select(`
      *,
      order:orders(order_number, event_date, status)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching production order:', error)
    return null
  }

  // Fetch movements with ingredient details including nutritional info
  const { data: movements, error: movError } = await supabase
    .from('production_movements')
    .select('*, ingredient:ingredients(id, name, unit, current_stock, unit_cost, calories, protein, fat, saturated_fat, carbohydrates, sugar, fiber, sodium)')
    .eq('production_order_id', id)
    .order('created_at')

  if (movError) {
    console.error('Error fetching production movements:', movError)
  }

  // Fallback: if no movements exist (recipe was configured after order creation),
  // fetch from the recipes table and format as pseudo-movements for display
  let resolvedMovements = movements || []
  if (resolvedMovements.length === 0) {
    const { data: recipeItems } = await supabase
      .from('recipes')
      .select('*, ingredient:ingredients(id, name, unit, current_stock, unit_cost, calories, protein, fat, saturated_fat, carbohydrates, sugar, fiber, sodium)')
      .eq('product_id', data.product_id)
      .eq('product_type', data.product_type)
      .order('created_at')

    if (recipeItems && recipeItems.length > 0) {
      resolvedMovements = recipeItems.map(item => ({
        id: item.id,
        production_order_id: id,
        ingredient_id: item.ingredient_id,
        planned_quantity: item.quantity_needed * data.quantity * (1 + item.waste_percentage / 100),
        actual_quantity: null,
        waste_quantity: 0,
        movement_id: null,
        waste_movement_id: null,
        created_at: item.created_at,
        ingredient: item.ingredient,
      }))
    }
  }

  return {
    ...data,
    movements: resolvedMovements,
  }
}

export async function createProductionOrder(input: {
  order_id?: string | null
  product_id: string
  product_type: 'cake' | 'cocktail' | 'pastry'
  product_name: string
  quantity?: number
  notes?: string
  created_by?: string
}): Promise<ProductionOrder | null> {
  const { order_id, product_id, product_type, product_name, quantity = 1, notes, created_by } = input

  // 1. Generate SKU
  const sku = await generateSKU(product_type)

  // 2. Insert production order
  const { data: po, error } = await supabase
    .from('production_orders')
    .insert({
      order_id: order_id || null,
      product_id,
      product_type,
      product_name,
      quantity,
      sku,
      status: 'pending',
      notes,
      created_by,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating production order:', error)
    return null
  }

  // 3. Load recipe and create production_movements
  const recipeItems = await getRecipesByProduct(product_id, product_type)

  if (recipeItems.length > 0) {
    const movements = recipeItems.map(item => ({
      production_order_id: po.id,
      ingredient_id: item.ingredient_id,
      planned_quantity: item.quantity_needed * quantity * (1 + item.waste_percentage / 100),
    }))

    const { error: movError } = await supabase
      .from('production_movements')
      .insert(movements)

    if (movError) {
      console.error('Error creating production movements:', movError)
    }
  }

  // 4. If linked to an order and order is confirmed, change order status to in_production
  if (order_id) {
    try {
      const { data: orderData } = await supabase
        .from('orders')
        .select('status')
        .eq('id', order_id)
        .single()

      if (orderData?.status === 'confirmed') {
        await updateOrderStatus(order_id, 'in_production')
      }
    } catch (e) {
      console.error('Error updating order status:', e)
    }
  }

  return po
}

export async function startProduction(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('production_orders')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error starting production:', error)
    return false
  }

  return true
}

export async function completeProduction(
  id: string,
  movements: Array<{
    id: string
    ingredient_id: string
    actual_quantity: number
    waste_quantity: number
  }>
): Promise<boolean> {
  // 1. Get production order for SKU reference + order_id
  const { data: po } = await supabase
    .from('production_orders')
    .select('sku, product_id, product_type, order_id')
    .eq('id', id)
    .single()

  if (!po) return false

  // 2. Ensure production_movements exist — they may be missing if the recipe was
  //    configured after the order was created (fallback path from getProductionOrderById)
  const { data: existingMovements } = await supabase
    .from('production_movements')
    .select('id, ingredient_id')
    .eq('production_order_id', id)

  const existingIngredientIds = new Set((existingMovements || []).map(m => m.ingredient_id))
  const missingMovements = movements.filter(m => !existingIngredientIds.has(m.ingredient_id))

  if (missingMovements.length > 0) {
    await supabase
      .from('production_movements')
      .insert(missingMovements.map(m => ({
        production_order_id: id,
        ingredient_id: m.ingredient_id,
        planned_quantity: m.actual_quantity, // best-effort: use actual as planned
      })))
  }

  // 3. For each movement, create inventory movements and update production_movement
  //    Match by (production_order_id + ingredient_id) to handle both real and fallback IDs
  for (const mov of movements) {
    // Create 'out' movement for actual quantity used
    if (mov.actual_quantity > 0) {
      const { data: outMov } = await supabase
        .from('inventory_movements')
        .insert({
          ingredient_id: mov.ingredient_id,
          movement_type: 'out',
          quantity: mov.actual_quantity,
          reference: `Producción ${po.sku}`,
        })
        .select('id')
        .single()

      if (outMov) {
        await supabase
          .from('production_movements')
          .update({
            actual_quantity: mov.actual_quantity,
            movement_id: outMov.id,
          })
          .eq('production_order_id', id)
          .eq('ingredient_id', mov.ingredient_id)
      }
    }

    // Create 'waste' movement if there's waste
    if (mov.waste_quantity > 0) {
      const { data: wasteMov } = await supabase
        .from('inventory_movements')
        .insert({
          ingredient_id: mov.ingredient_id,
          movement_type: 'waste',
          quantity: mov.waste_quantity,
          reference: `Merma producción ${po.sku}`,
        })
        .select('id')
        .single()

      if (wasteMov) {
        await supabase
          .from('production_movements')
          .update({
            waste_quantity: mov.waste_quantity,
            waste_movement_id: wasteMov.id,
          })
          .eq('production_order_id', id)
          .eq('ingredient_id', mov.ingredient_id)
      }
    }
  }

  // 3. Calculate nutritional info
  const { data: prodMovements } = await supabase
    .from('production_movements')
    .select('*, ingredient:ingredients(calories, protein, fat, saturated_fat, carbohydrates, sugar, fiber, sodium)')
    .eq('production_order_id', id)

  const nutritionalInfo = calculateNutritionalInfo(prodMovements || [])

  // 4. Mark production order as completed
  const { error } = await supabase
    .from('production_orders')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      nutritional_info: nutritionalInfo,
    })
    .eq('id', id)

  if (error) {
    console.error('Error completing production:', error)
    return false
  }

  // 5. If linked to an order, check if ALL production orders for that order are completed → mark order as 'ready'
  if (po.order_id) {
    try {
      const { data: siblingPOs } = await supabase
        .from('production_orders')
        .select('id, status')
        .eq('order_id', po.order_id)
        .neq('status', 'cancelled')

      const allCompleted = siblingPOs?.every(p => p.status === 'completed') ?? false

      if (allCompleted) {
        await updateOrderStatus(po.order_id, 'ready')
      }
    } catch (e) {
      console.error('Error updating order status to ready:', e)
    }
  }

  return true
}

export async function cancelProduction(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('production_orders')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) {
    console.error('Error cancelling production:', error)
    return false
  }

  return true
}

// ============ Stock Check ============

export async function checkStockForProduction(productionOrderId: string): Promise<Array<{
  ingredient_id: string
  ingredient_name: string
  unit: string
  planned_quantity: number
  current_stock: number
  sufficient: boolean
}>> {
  const { data: movements } = await supabase
    .from('production_movements')
    .select('*, ingredient:ingredients(id, name, unit, current_stock)')
    .eq('production_order_id', productionOrderId)

  if (!movements) return []

  return movements.map(mov => ({
    ingredient_id: mov.ingredient_id,
    ingredient_name: (mov.ingredient as any)?.name || 'Desconocido',
    unit: (mov.ingredient as any)?.unit || '',
    planned_quantity: mov.planned_quantity,
    current_stock: (mov.ingredient as any)?.current_stock || 0,
    sufficient: ((mov.ingredient as any)?.current_stock || 0) >= mov.planned_quantity,
  }))
}

// ============ Stats ============

export interface ProductionStats {
  pending: number
  inProgress: number
  completedToday: number
  monthlyWaste: number
  overdue: number
  efficiencyPercent: number
  monthlyWasteCost: number
}

export async function getProductionStats(month: number, year: number): Promise<ProductionStats> {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  try {
    const [
      { count: pendingCount },
      { count: inProgressCount },
      { data: completedTodayData },
      { data: wasteMovements },
      { data: overdueOrders },
      { data: efficiencyData },
    ] = await Promise.all([
      supabase
        .from('production_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('production_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress'),
      supabase
        .from('production_orders')
        .select('id')
        .eq('status', 'completed')
        .gte('completed_at', today + 'T00:00:00')
        .lte('completed_at', today + 'T23:59:59'),
      supabase
        .from('production_movements')
        .select('waste_quantity, ingredient:ingredients(unit_cost)')
        .gt('waste_quantity', 0)
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59'),
      // Overdue: pending/in_progress orders whose linked order event_date <= today
      supabase
        .from('production_orders')
        .select('id, order:orders(event_date)')
        .in('status', ['pending', 'in_progress'])
        .not('order_id', 'is', null),
      // Efficiency: completed orders this month with movements
      supabase
        .from('production_movements')
        .select('planned_quantity, actual_quantity')
        .not('actual_quantity', 'is', null)
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59'),
    ])

    const monthlyWaste = wasteMovements?.reduce((sum, m) => sum + (m.waste_quantity || 0), 0) || 0
    const monthlyWasteCost = wasteMovements?.reduce((sum, m) => {
      const unitCost = (m.ingredient as any)?.unit_cost || 0
      return sum + (m.waste_quantity || 0) * unitCost
    }, 0) || 0

    // Count overdue
    const overdue = (overdueOrders || []).filter(o => {
      const eventDate = (o.order as any)?.event_date
      return eventDate && eventDate <= today
    }).length

    // Efficiency: sum(planned) vs sum(actual)
    let efficiencyPercent = 100
    if (efficiencyData && efficiencyData.length > 0) {
      const totalPlanned = efficiencyData.reduce((s, m) => s + (m.planned_quantity || 0), 0)
      const totalActual = efficiencyData.reduce((s, m) => s + (m.actual_quantity || 0), 0)
      if (totalPlanned > 0) {
        efficiencyPercent = Math.round((totalActual / totalPlanned) * 100)
      }
    }

    return {
      pending: pendingCount || 0,
      inProgress: inProgressCount || 0,
      completedToday: completedTodayData?.length || 0,
      monthlyWaste,
      overdue,
      efficiencyPercent,
      monthlyWasteCost,
    }
  } catch (error) {
    console.error('Error fetching production stats:', error)
    return { pending: 0, inProgress: 0, completedToday: 0, monthlyWaste: 0, overdue: 0, efficiencyPercent: 100, monthlyWasteCost: 0 }
  }
}

// ============ Batch Operations ============

export async function batchStartProduction(ids: string[]): Promise<boolean> {
  const { error } = await supabase
    .from('production_orders')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .in('id', ids)
    .eq('status', 'pending')

  if (error) {
    console.error('Error batch starting production:', error)
    return false
  }
  return true
}

export async function batchCancelProduction(ids: string[]): Promise<boolean> {
  const { error } = await supabase
    .from('production_orders')
    .update({ status: 'cancelled' })
    .in('id', ids)

  if (error) {
    console.error('Error batch cancelling production:', error)
    return false
  }
  return true
}

// ============ Confirmed Orders (for linking) ============

export interface ConfirmedOrderForProduction {
  id: string
  order_number: string
  event_date: string
  customer_name: string
  items: Array<{
    id: string
    service_type: string
    product_name: string | null
    quantity: number
    service_data: Record<string, unknown>
  }>
}

export async function getConfirmedOrders(): Promise<ConfirmedOrderForProduction[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      event_date,
      customers(first_name, last_name),
      order_items(id, service_type, product_name, quantity, service_data)
    `)
    .eq('status', 'confirmed')
    .order('event_date', { ascending: true })

  if (error) {
    console.error('Error fetching confirmed orders:', error)
    return []
  }

  return (data || []).map(order => {
    const customer = Array.isArray(order.customers)
      ? order.customers[0]
      : order.customers
    return {
      id: order.id,
      order_number: order.order_number,
      event_date: order.event_date,
      customer_name: customer
        ? `${customer.first_name} ${customer.last_name}`
        : 'Cliente',
      items: (order.order_items as any[]) || [],
    }
  })
}

// ============ Production Cost by Order ============

export async function getProductionCostsByOrderIds(
  orderIds: string[]
): Promise<Record<string, number>> {
  if (orderIds.length === 0) return {}

  // Get all production orders for these orders, with their movements + ingredient cost
  const { data, error } = await supabase
    .from('production_orders')
    .select(`
      order_id,
      status,
      production_movements(
        actual_quantity,
        planned_quantity,
        waste_quantity,
        ingredient:ingredients(unit_cost)
      )
    `)
    .in('order_id', orderIds)
    .neq('status', 'cancelled')

  if (error) {
    console.error('Error fetching production costs:', error)
    return {}
  }

  const costMap: Record<string, number> = {}

  for (const po of data || []) {
    if (!po.order_id) continue
    const movements = (po.production_movements as any[]) || []

    let poCost = 0
    for (const mov of movements) {
      const unitCost = (mov.ingredient as any)?.unit_cost || 0
      // Use actual_quantity if completed, otherwise planned_quantity
      const qty = mov.actual_quantity ?? mov.planned_quantity ?? 0
      const waste = mov.waste_quantity || 0
      poCost += (qty + waste) * unitCost
    }

    costMap[po.order_id] = (costMap[po.order_id] || 0) + poCost
  }

  return costMap
}
