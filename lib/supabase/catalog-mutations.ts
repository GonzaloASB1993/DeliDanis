// Mutaciones para el catálogo (CRUD de productos, categorías, subcategorías)

import { supabase } from './client'

// ============================================
// TIPOS
// ============================================

export type ProductType = 'cake' | 'cocktail' | 'pastry'

export interface CategoryInput {
  name: string
  slug: string
  description?: string
  image_url?: string
  icon?: string
  is_active?: boolean
  order_index?: number
}

export interface SubcategoryInput {
  category_id: string
  name: string
  slug: string
  description?: string
  is_active?: boolean
  order_index?: number
}

export interface CakeProductInput {
  category_id: string
  subcategory_id?: string
  name: string
  slug: string
  description?: string
  base_price: number
  min_portions?: number
  max_portions?: number
  price_per_portion?: number
  preparation_days?: number
  is_customizable?: boolean
  is_active?: boolean
  is_featured?: boolean
  metadata?: Record<string, unknown>
}

export interface CocktailProductInput {
  subcategory_id: string
  name: string
  slug: string
  description?: string
  price: number
  min_order_quantity?: number
  image_url?: string
  is_active?: boolean
  is_featured?: boolean
  order_index?: number
}

export interface PastryProductInput {
  category_id: string
  subcategory_id?: string
  name: string
  slug: string
  description?: string
  price: number
  unit?: string
  min_order_quantity?: number
  image_url?: string
  is_active?: boolean
  is_featured?: boolean
  order_index?: number
}

export interface ProductImageInput {
  product_type: ProductType
  product_id: string
  url: string
  alt_text?: string
  is_primary?: boolean
  order_index?: number
}

// ============================================
// HELPERS
// ============================================

function getTableNames(type: ProductType) {
  return {
    categories: `${type}_categories`,
    subcategories: `${type}_subcategories`,
    products: `${type}_products`,
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ============================================
// CATEGORÍAS
// ============================================

export async function createCategory(type: ProductType, input: CategoryInput) {
  const { categories } = getTableNames(type)
  const slug = input.slug || generateSlug(input.name)

  const { data, error } = await supabase
    .from(categories)
    .insert({ ...input, slug })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCategory(type: ProductType, id: string, input: Partial<CategoryInput>) {
  const { categories } = getTableNames(type)

  const { data, error } = await supabase
    .from(categories)
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategory(type: ProductType, id: string) {
  const { categories } = getTableNames(type)

  const { error } = await supabase
    .from(categories)
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getCategories(type: ProductType) {
  const { categories } = getTableNames(type)

  const { data, error } = await supabase
    .from(categories)
    .select('*')
    .order('order_index', { ascending: true })

  if (error) throw error
  return data
}

// ============================================
// SUBCATEGORÍAS
// ============================================

export async function createSubcategory(type: ProductType, input: SubcategoryInput) {
  const { subcategories } = getTableNames(type)
  const slug = input.slug || generateSlug(input.name)

  const { data, error } = await supabase
    .from(subcategories)
    .insert({ ...input, slug })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSubcategory(type: ProductType, id: string, input: Partial<SubcategoryInput>) {
  const { subcategories } = getTableNames(type)

  const { data, error } = await supabase
    .from(subcategories)
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSubcategory(type: ProductType, id: string) {
  const { subcategories } = getTableNames(type)

  const { error } = await supabase
    .from(subcategories)
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getSubcategories(type: ProductType, categoryId?: string) {
  const { subcategories } = getTableNames(type)

  let query = supabase
    .from(subcategories)
    .select('*')
    .order('order_index', { ascending: true })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// ============================================
// PRODUCTOS - TORTAS
// ============================================

export async function createCakeProduct(input: CakeProductInput) {
  const slug = input.slug || generateSlug(input.name)

  const { data, error } = await supabase
    .from('cake_products')
    .insert({ ...input, slug })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCakeProduct(id: string, input: Partial<CakeProductInput>) {
  const { data, error } = await supabase
    .from('cake_products')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCakeProduct(id: string) {
  // Primero eliminar imágenes asociadas
  await supabase
    .from('product_images')
    .delete()
    .eq('product_id', id)
    .eq('product_type', 'cake')

  const { error } = await supabase
    .from('cake_products')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getCakeProductsAdmin() {
  const { data, error } = await supabase
    .from('cake_products')
    .select(`
      *,
      category:cake_categories(id, name),
      subcategory:cake_subcategories(id, name)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Obtener imágenes
  const productIds = data.map(p => p.id)
  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_type', 'cake')
    .in('product_id', productIds)
    .order('order_index', { ascending: true })

  return data.map(product => ({
    ...product,
    images: images?.filter(img => img.product_id === product.id) || []
  }))
}

// ============================================
// PRODUCTOS - COCTELERÍA
// ============================================

export async function createCocktailProduct(input: CocktailProductInput) {
  const slug = input.slug || generateSlug(input.name)

  const { data, error } = await supabase
    .from('cocktail_products')
    .insert({ ...input, slug })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCocktailProduct(id: string, input: Partial<CocktailProductInput>) {
  const { data, error } = await supabase
    .from('cocktail_products')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCocktailProduct(id: string) {
  // Primero eliminar imágenes asociadas
  await supabase
    .from('product_images')
    .delete()
    .eq('product_id', id)
    .eq('product_type', 'cocktail')

  const { error } = await supabase
    .from('cocktail_products')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getCocktailProductsAdmin() {
  const { data, error } = await supabase
    .from('cocktail_products')
    .select(`
      *,
      subcategory:cocktail_subcategories(
        id,
        name,
        category:cocktail_categories(id, name)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Obtener imágenes
  const productIds = data.map(p => p.id)
  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_type', 'cocktail')
    .in('product_id', productIds)
    .order('order_index', { ascending: true })

  return data.map(product => ({
    ...product,
    images: images?.filter(img => img.product_id === product.id) || []
  }))
}

// ============================================
// PRODUCTOS - PASTELERÍA
// ============================================

export async function createPastryProduct(input: PastryProductInput) {
  const slug = input.slug || generateSlug(input.name)

  const { data, error } = await supabase
    .from('pastry_products')
    .insert({ ...input, slug })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePastryProduct(id: string, input: Partial<PastryProductInput>) {
  const { data, error } = await supabase
    .from('pastry_products')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePastryProduct(id: string) {
  // Primero eliminar imágenes asociadas
  await supabase
    .from('product_images')
    .delete()
    .eq('product_id', id)
    .eq('product_type', 'pastry')

  const { error } = await supabase
    .from('pastry_products')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getPastryProductsAdmin() {
  const { data, error } = await supabase
    .from('pastry_products')
    .select(`
      *,
      category:pastry_categories(id, name),
      subcategory:pastry_subcategories(id, name)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Obtener imágenes
  const productIds = data.map(p => p.id)
  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_type', 'pastry')
    .in('product_id', productIds)
    .order('order_index', { ascending: true })

  return data.map(product => ({
    ...product,
    images: images?.filter(img => img.product_id === product.id) || []
  }))
}

// ============================================
// IMÁGENES
// ============================================

export async function uploadProductImage(file: File, productType: ProductType, productId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${productType}/${productId}/${Date.now()}.${fileExt}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName)

  return publicUrl
}

export async function addProductImage(input: ProductImageInput) {
  // Si es primary, quitar primary de las otras
  if (input.is_primary) {
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', input.product_id)
      .eq('product_type', input.product_type)
  }

  const { data, error } = await supabase
    .from('product_images')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProductImage(id: string, input: Partial<ProductImageInput>) {
  const { data, error } = await supabase
    .from('product_images')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProductImage(id: string, url: string) {
  // Eliminar del storage
  const path = url.split('/product-images/')[1]
  if (path) {
    await supabase.storage.from('product-images').remove([path])
  }

  // Eliminar registro
  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getProductImages(productType: ProductType, productId: string) {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_type', productType)
    .eq('product_id', productId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data
}

export async function setImageAsPrimary(id: string, productType: ProductType, productId: string) {
  // Quitar primary de todas
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)
    .eq('product_type', productType)

  // Setear esta como primary
  const { data, error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// TOGGLE ACTIVE/FEATURED
// ============================================

export async function toggleProductActive(type: ProductType, id: string, is_active: boolean) {
  const { products } = getTableNames(type)

  const { data, error } = await supabase
    .from(products)
    .update({ is_active })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function toggleProductFeatured(type: ProductType, id: string, is_featured: boolean) {
  const { products } = getTableNames(type)

  const { data, error } = await supabase
    .from(products)
    .update({ is_featured })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
