import { OrderStatus, PaymentStatus, DeliveryType, EventType } from '@/lib/utils/constants'

export interface Order {
  id: string
  order_number: string
  customer_id: string
  status: OrderStatus
  event_date: string
  event_time: string | null
  delivery_date: string
  delivery_time: string | null
  delivery_type: DeliveryType
  delivery_address: string | null
  delivery_city: string | null
  delivery_notes: string | null
  delivery_fee: number
  subtotal: number
  discount: number
  total: number
  deposit_amount: number
  deposit_paid: boolean
  payment_method: string | null
  payment_status: PaymentStatus
  payment_reference: string | null
  event_type: EventType | null
  special_requests: string | null
  internal_notes: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  portions: number | null
  unit_price: number
  total_price: number
  customizations: Record<string, any>
  notes: string | null
  created_at: string
}

export interface OrderHistory {
  id: string
  order_id: string
  status: OrderStatus
  notes: string | null
  created_by: string | null
  created_at: string
}

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

export interface OrderWithDetails extends Order {
  items: OrderItem[]
  customer: Customer
  history: OrderHistory[]
}
