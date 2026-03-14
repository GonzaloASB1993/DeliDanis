import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Obtiene todos los productos de tortas activos con sus imágenes, categorías y subcategorías
 */
export async function getCakeProducts() {
  try {
    // Primero obtenemos los productos con sus relaciones
    const { data: products, error: productsError } = await supabase
      .from('cake_products')
      .select(`
        *,
        category:cake_categories(*),
        subcategory:cake_subcategories(*)
      `)
      .eq('is_active', true)
      .order('name')

    if (productsError) {
      console.error('Error loading cake products:', productsError)
      return { success: false, products: [] }
    }

    // Luego obtenemos las imágenes de todos los productos de tipo 'cake'
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_type', 'cake')

    if (imagesError) {
      console.error('Error loading product images:', imagesError)
    }

    // Combinar productos con sus imágenes
    const productsWithImages = products?.map((product) => ({
      ...product,
      images: images?.filter((img) => img.product_id === product.id) || [],
    }))

    return { success: true, products: productsWithImages || [] }
  } catch (error) {
    console.error('Error loading cake products:', error)
    return { success: false, products: [] }
  }
}

/**
 * Obtiene todos los productos de pastelería activos con sus imágenes, categorías y subcategorías
 */
export async function getPastryProducts() {
  try {
    // Obtener productos con sus relaciones
    const { data: products, error: productsError } = await supabase
      .from('pastry_products')
      .select(`
        *,
        category:pastry_categories(*),
        subcategory:pastry_subcategories(*)
      `)
      .eq('is_active', true)
      .order('order_index')

    if (productsError) {
      console.error('Error loading pastry products:', productsError)
      return { success: false, products: [] }
    }

    // Obtener imágenes de tipo 'pastry'
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_type', 'pastry')

    if (imagesError) {
      console.error('Error loading product images:', imagesError)
    }

    // Combinar productos con sus imágenes
    const productsWithImages = products?.map((product) => {
      // Obtener imágenes de product_images
      const productImages = images?.filter((img) => img.product_id === product.id) || []

      // Si no hay imágenes en product_images pero el producto tiene image_url, crear una imagen sintética
      if (productImages.length === 0 && product.image_url) {
        productImages.push({
          id: `${product.id}-default`,
          product_id: product.id,
          url: product.image_url,
          alt_text: product.name,
          is_primary: true,
          order_index: 0,
          created_at: product.created_at,
        })
      }

      return {
        ...product,
        images: productImages,
      }
    })

    return { success: true, products: productsWithImages || [] }
  } catch (error) {
    console.error('Error loading pastry products:', error)
    return { success: false, products: [] }
  }
}

/**
 * Obtiene todos los productos de coctelería activos con categorías, subcategorías e imágenes
 */
export async function getCocktailProducts() {
  try {
    // Obtener productos con relaciones
    const { data: products, error: productsError } = await supabase
      .from('cocktail_products')
      .select(`
        *,
        subcategory:cocktail_subcategories(
          *,
          category:cocktail_categories(*)
        )
      `)
      .eq('is_active', true)
      .order('order_index')

    if (productsError) {
      console.error('Error loading cocktail products:', productsError)
      return { success: false, products: [] }
    }

    // Obtener imágenes de tipo 'cocktail'
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_type', 'cocktail')

    if (imagesError) {
      console.error('Error loading product images:', imagesError)
    }

    // Combinar productos con sus imágenes
    const productsWithImages = products?.map((product) => {
      // Obtener imágenes de product_images
      const productImages = images?.filter((img) => img.product_id === product.id) || []

      // Si no hay imágenes en product_images pero el producto tiene image_url, crear una imagen sintética
      if (productImages.length === 0 && product.image_url) {
        productImages.push({
          id: `${product.id}-default`,
          product_id: product.id,
          url: product.image_url,
          alt_text: product.name,
          is_primary: true,
          order_index: 0,
          created_at: product.created_at,
        })
      }

      return {
        ...product,
        images: productImages,
      }
    })

    return { success: true, products: productsWithImages || [] }
  } catch (error) {
    console.error('Error loading cocktail products:', error)
    return { success: false, products: [] }
  }
}

/**
 * Obtiene categorías de cocktail con sus subcategorías y productos
 */
export async function getCocktailCategoriesWithProducts() {
  try {
    const { data, error } = await supabase
      .from('cocktail_categories')
      .select(`
        *,
        subcategories:cocktail_subcategories(
          *,
          products:cocktail_products(*)
        )
      `)
      .eq('is_active', true)
      .order('order_index')

    if (error) {
      console.error('Error loading cocktail categories:', error)
      return { success: false, categories: [] }
    }

    return { success: true, categories: data || [] }
  } catch (error) {
    console.error('Error loading cocktail categories:', error)
    return { success: false, categories: [] }
  }
}

/**
 * Obtiene categorías de tortas con sus subcategorías y productos
 */
export async function getCakeCategoriesWithProducts() {
  try {
    const { data, error } = await supabase
      .from('cake_categories')
      .select(`
        *,
        subcategories:cake_subcategories(
          *,
          products:cake_products(*)
        )
      `)
      .eq('is_active', true)
      .order('order_index')

    if (error) {
      console.error('Error loading cake categories:', error)
      return { success: false, categories: [] }
    }

    return { success: true, categories: data || [] }
  } catch (error) {
    console.error('Error loading cake categories:', error)
    return { success: false, categories: [] }
  }
}

/**
 * Obtiene categorías de pastelería con sus subcategorías y productos
 */
export async function getPastryCategoriesWithProducts() {
  try {
    const { data, error } = await supabase
      .from('pastry_categories')
      .select(`
        *,
        subcategories:pastry_subcategories(
          *,
          products:pastry_products(*)
        )
      `)
      .eq('is_active', true)
      .order('order_index')

    if (error) {
      console.error('Error loading pastry categories:', error)
      return { success: false, categories: [] }
    }

    return { success: true, categories: data || [] }
  } catch (error) {
    console.error('Error loading pastry categories:', error)
    return { success: false, categories: [] }
  }
}
