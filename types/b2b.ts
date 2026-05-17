export interface B2BPrice {
  id: string
  product_id: string
  product_type: 'cake' | 'pastry' | 'cocktail'
  price: number
  min_quantity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface B2BProduct {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  product_type: 'cake' | 'pastry' | 'cocktail'
  category_name: string | null
  image_url: string | null
  b2b_price: number
  min_quantity: number
  is_active: boolean
}

export interface B2BCartItem {
  productId: string
  productType: 'cake' | 'pastry' | 'cocktail'
  productName: string
  imageUrl: string | null
  quantity: number
  unitPrice: number
  minQuantity: number
}

export interface B2BOrderSummary {
  id: string
  order_number: string
  status: string
  total: number
  item_count: number
  created_at: string
}

export interface B2BOrderDetail {
  id: string
  order_number: string
  status: string
  subtotal: number
  total: number
  created_at: string
  items: B2BOrderItem[]
}

export interface B2BOrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}
