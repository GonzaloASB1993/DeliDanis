// Funciones de consulta para productos de coctelería
import { supabase } from './client'
import type {
  CocktailCategory,
  CocktailSubcategory,
  CocktailProduct,
  CocktailSettings,
  CocktailCategoryWithSubcategories,
  CocktailSubcategoryWithProducts,
} from '@/types/cocktail'

/**
 * Obtiene la configuración global de coctelería (pedido mínimo, etc.)
 */
export async function getCocktailSettings(): Promise<CocktailSettings | null> {
  const { data, error } = await supabase
    .from('cocktail_settings')
    .select('*')
    .single()

  if (error) {
    console.error('Error fetching cocktail settings:', error)
    return null
  }

  return data
}

/**
 * Obtiene todas las categorías activas (Dulce/Salado)
 */
export async function getCocktailCategories(): Promise<CocktailCategory[]> {
  const { data, error } = await supabase
    .from('cocktail_categories')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching cocktail categories:', error)
    return []
  }

  return data || []
}

/**
 * Obtiene todas las categorías con sus subcategorías
 */
export async function getCocktailCategoriesWithSubcategories(): Promise<
  CocktailCategoryWithSubcategories[]
> {
  const { data, error } = await supabase
    .from('cocktail_categories')
    .select(
      `
      *,
      subcategories:cocktail_subcategories(*)
    `
    )
    .eq('is_active', true)
    .eq('cocktail_subcategories.is_active', true)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching categories with subcategories:', error)
    return []
  }

  return (data || []).map((cat) => ({
    ...cat,
    subcategories: (cat.subcategories || []).sort(
      (a: CocktailSubcategory, b: CocktailSubcategory) => a.order_index - b.order_index
    ),
  }))
}

/**
 * Obtiene subcategorías por categoría
 */
export async function getCocktailSubcategoriesByCategory(
  categoryId: string
): Promise<CocktailSubcategory[]> {
  const { data, error } = await supabase
    .from('cocktail_subcategories')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching cocktail subcategories:', error)
    return []
  }

  return data || []
}

/**
 * Obtiene una subcategoría con sus productos
 */
export async function getCocktailSubcategoryWithProducts(
  subcategoryId: string
): Promise<CocktailSubcategoryWithProducts | null> {
  const { data, error } = await supabase
    .from('cocktail_subcategories')
    .select(
      `
      *,
      products:cocktail_products(*),
      category:cocktail_categories(*)
    `
    )
    .eq('id', subcategoryId)
    .eq('is_active', true)
    .eq('cocktail_products.is_active', true)
    .single()

  if (error) {
    console.error('Error fetching subcategory with products:', error)
    return null
  }

  if (!data) return null

  return {
    ...data,
    products: (data.products || []).sort(
      (a: CocktailProduct, b: CocktailProduct) => a.order_index - b.order_index
    ),
  }
}

/**
 * Obtiene productos por subcategoría
 */
export async function getCocktailProductsBySubcategory(
  subcategoryId: string
): Promise<CocktailProduct[]> {
  const { data, error } = await supabase
    .from('cocktail_products')
    .select('*')
    .eq('subcategory_id', subcategoryId)
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching cocktail products:', error)
    return []
  }

  return data || []
}

/**
 * Obtiene un producto por ID
 */
export async function getCocktailProduct(
  productId: string
): Promise<CocktailProduct | null> {
  const { data, error } = await supabase
    .from('cocktail_products')
    .select('*')
    .eq('id', productId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching cocktail product:', error)
    return null
  }

  return data
}

/**
 * Obtiene todos los productos activos (útil para búsqueda)
 */
export async function getAllCocktailProducts(): Promise<CocktailProduct[]> {
  const { data, error } = await supabase
    .from('cocktail_products')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching all cocktail products:', error)
    return []
  }

  return data || []
}

/**
 * Obtiene productos destacados
 */
export async function getFeaturedCocktailProducts(): Promise<CocktailProduct[]> {
  const { data, error } = await supabase
    .from('cocktail_products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('order_index', { ascending: true })
    .limit(6)

  if (error) {
    console.error('Error fetching featured cocktail products:', error)
    return []
  }

  return data || []
}

/**
 * Busca productos por nombre
 */
export async function searchCocktailProducts(
  query: string
): Promise<CocktailProduct[]> {
  const { data, error } = await supabase
    .from('cocktail_products')
    .select('*')
    .eq('is_active', true)
    .ilike('name', `%${query}%`)
    .order('order_index', { ascending: true })
    .limit(20)

  if (error) {
    console.error('Error searching cocktail products:', error)
    return []
  }

  return data || []
}
