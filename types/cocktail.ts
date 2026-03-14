// Tipos para productos de coctelería

export interface CocktailCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface CocktailSubcategory {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface CocktailProduct {
  id: string
  subcategory_id: string
  name: string
  slug: string
  description: string | null
  price: number
  min_order_quantity: number
  image_url: string | null
  is_active: boolean
  is_featured: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface CocktailSettings {
  id: string
  min_order_amount: number
  updated_at: string
}

// Tipos extendidos con relaciones
export interface CocktailCategoryWithSubcategories extends CocktailCategory {
  subcategories: CocktailSubcategory[]
}

export interface CocktailSubcategoryWithProducts extends CocktailSubcategory {
  products: CocktailProduct[]
  category?: CocktailCategory
}

export interface CocktailProductWithDetails extends CocktailProduct {
  subcategory?: CocktailSubcategory
}

// Tipos para el carrito/pedido
export interface CocktailCartItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}
