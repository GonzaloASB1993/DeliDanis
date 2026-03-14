import { supabase } from './client'

// ============ Types ============

export interface Ingredient {
  id: string
  name: string
  category: string | null
  unit: string
  current_stock: number
  min_stock: number
  unit_cost: number
  supplier: string | null
  is_active: boolean
  calories: number
  protein: number
  fat: number
  saturated_fat: number
  carbohydrates: number
  sugar: number
  fiber: number
  sodium: number
  created_at: string
  updated_at: string
}

export interface InventoryMovement {
  id: string
  ingredient_id: string
  movement_type: 'in' | 'out' | 'adjustment' | 'waste'
  quantity: number
  unit_cost: number | null
  reference: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  ingredient?: { name: string; unit: string }
}

export interface RecipeItem {
  id: string
  product_id: string
  product_type: 'cake' | 'cocktail' | 'pastry'
  ingredient_id: string
  quantity_needed: number
  waste_percentage: number
  created_at: string
  ingredient?: Ingredient
}

export interface IngredientFilters {
  search?: string
  category?: string
  lowStockOnly?: boolean
  activeOnly?: boolean
}

export interface MovementFilters {
  ingredientId?: string
  type?: string
  dateFrom?: string
  dateTo?: string
}

// ============ Ingredients ============

export async function getIngredients(filters: IngredientFilters = {}): Promise<Ingredient[]> {
  let query = supabase
    .from('ingredients')
    .select('*')
    .order('name', { ascending: true })

  if (filters.activeOnly !== false) {
    query = query.eq('is_active', true)
  }

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching ingredients:', error)
    return []
  }

  let results = data || []

  if (filters.search) {
    const term = filters.search.toLowerCase()
    results = results.filter(i =>
      i.name.toLowerCase().includes(term) ||
      i.supplier?.toLowerCase().includes(term)
    )
  }

  if (filters.lowStockOnly) {
    results = results.filter(i => i.current_stock <= i.min_stock)
  }

  return results
}

export async function getIngredientById(id: string): Promise<Ingredient | null> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching ingredient:', error)
    return null
  }

  return data
}

export async function createIngredient(ingredient: {
  name: string
  category?: string
  unit: string
  min_stock?: number
  unit_cost?: number
  supplier?: string
  initial_stock?: number
}): Promise<Ingredient | null> {
  const { initial_stock, ...ingredientData } = ingredient

  const { data, error } = await supabase
    .from('ingredients')
    .insert({
      ...ingredientData,
      current_stock: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating ingredient:', error)
    return null
  }

  // Create initial stock movement if provided
  if (initial_stock && initial_stock > 0 && data) {
    await createMovement({
      ingredient_id: data.id,
      movement_type: 'in',
      quantity: initial_stock,
      unit_cost: ingredient.unit_cost,
      reference: 'Stock inicial',
    })
  }

  // Re-fetch to get updated stock
  if (data && initial_stock && initial_stock > 0) {
    return getIngredientById(data.id)
  }

  return data
}

export async function updateIngredient(
  id: string,
  updates: Partial<Pick<Ingredient, 'name' | 'category' | 'unit' | 'min_stock' | 'unit_cost' | 'supplier' | 'calories' | 'protein' | 'fat' | 'saturated_fat' | 'carbohydrates' | 'sugar' | 'fiber' | 'sodium'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('ingredients')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating ingredient:', error)
    return false
  }

  return true
}

export async function deleteIngredient(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('ingredients')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting ingredient:', error)
    return false
  }

  return true
}

export async function toggleIngredientActive(id: string, active: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('ingredients')
    .update({ is_active: active })
    .eq('id', id)

  if (error) {
    console.error('Error toggling ingredient:', error)
    return false
  }

  return true
}

// ============ Movements ============

export async function getMovements(filters: MovementFilters = {}): Promise<InventoryMovement[]> {
  let query = supabase
    .from('inventory_movements')
    .select('*, ingredient:ingredients(name, unit)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (filters.ingredientId) {
    query = query.eq('ingredient_id', filters.ingredientId)
  }

  if (filters.type) {
    query = query.eq('movement_type', filters.type)
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo + 'T23:59:59')
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching movements:', error)
    return []
  }

  return data || []
}

export async function createMovement(movement: {
  ingredient_id: string
  movement_type: 'in' | 'out' | 'adjustment' | 'waste'
  quantity: number
  unit_cost?: number | null
  reference?: string
  notes?: string
  created_by?: string
}): Promise<boolean> {
  const { error } = await supabase
    .from('inventory_movements')
    .insert(movement)

  if (error) {
    console.error('Error creating movement:', error)
    return false
  }

  return true
}

// ============ Low Stock ============

export async function getLowStockIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching low stock ingredients:', error)
    return []
  }

  // Filter where current_stock <= min_stock (done client-side because Supabase
  // doesn't support column-to-column comparison in .lte())
  return (data || []).filter(i => i.current_stock <= i.min_stock && i.min_stock > 0)
}

// ============ Categories ============

export async function getIngredientCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('category')
    .not('category', 'is', null)

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  const unique = new Set((data || []).map(d => d.category).filter(Boolean) as string[])
  return Array.from(unique).sort()
}

// ============ Recipes ============

export async function getRecipesByProduct(
  productId: string,
  productType: 'cake' | 'cocktail' | 'pastry'
): Promise<RecipeItem[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, ingredient:ingredients(*)')
    .eq('product_id', productId)
    .eq('product_type', productType)
    .order('created_at')

  if (error) {
    console.error('Error fetching recipes:', error)
    return []
  }

  return data || []
}

export async function saveRecipe(
  productId: string,
  productType: 'cake' | 'cocktail' | 'pastry',
  items: { ingredient_id: string; quantity_needed: number; waste_percentage: number }[]
): Promise<boolean> {
  // Delete existing recipe items
  const { error: deleteError } = await supabase
    .from('recipes')
    .delete()
    .eq('product_id', productId)
    .eq('product_type', productType)

  if (deleteError) {
    console.error('Error deleting old recipe:', deleteError)
    return false
  }

  if (items.length === 0) return true

  // Insert new items
  const rows = items.map(item => ({
    product_id: productId,
    product_type: productType,
    ingredient_id: item.ingredient_id,
    quantity_needed: item.quantity_needed,
    waste_percentage: item.waste_percentage,
  }))

  const { error: insertError } = await supabase
    .from('recipes')
    .insert(rows)

  if (insertError) {
    console.error('Error saving recipe:', insertError)
    return false
  }

  return true
}

export async function calculateProductCost(
  productId: string,
  productType: 'cake' | 'cocktail' | 'pastry'
): Promise<number> {
  const items = await getRecipesByProduct(productId, productType)

  return items.reduce((total, item) => {
    const unitCost = item.ingredient?.unit_cost || 0
    const wasteFactor = 1 + (item.waste_percentage / 100)
    return total + (item.quantity_needed * unitCost * wasteFactor)
  }, 0)
}

// ============ Waste Stats ============

export async function getWasteStats(month: number, year: number): Promise<{
  totalWasteCount: number
  totalWasteCost: number
}> {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('inventory_movements')
    .select('quantity, unit_cost, ingredient:ingredients(unit_cost)')
    .eq('movement_type', 'waste')
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')

  if (error) {
    console.error('Error fetching waste stats:', error)
    return { totalWasteCount: 0, totalWasteCost: 0 }
  }

  const totalWasteCount = data?.length || 0
  const totalWasteCost = (data || []).reduce((sum, m) => {
    const cost = m.unit_cost || (m.ingredient as any)?.unit_cost || 0
    return sum + (m.quantity * cost)
  }, 0)

  return { totalWasteCount, totalWasteCost }
}

// ============ Inventory Value ============

export async function getInventoryValue(): Promise<number> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('current_stock, unit_cost')
    .eq('is_active', true)

  if (error) {
    console.error('Error calculating inventory value:', error)
    return 0
  }

  return (data || []).reduce((sum, i) => sum + (i.current_stock * i.unit_cost), 0)
}
