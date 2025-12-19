export interface Product {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  base_price: number
  min_portions: number
  max_portions: number
  price_per_portion: number | null
  preparation_days: number
  is_customizable: boolean
  is_active: boolean
  is_featured: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string | null
  is_primary: boolean
  order_index: number
  created_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  variant_type: 'size' | 'flavor' | 'filling' | 'topping'
  name: string
  price_modifier: number
  is_default: boolean
  is_active: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductWithImages extends Product {
  images: ProductImage[]
  category?: Category
}

export interface ProductWithVariants extends ProductWithImages {
  variants: ProductVariant[]
}
