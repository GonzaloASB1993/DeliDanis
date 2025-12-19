// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PRODUCTION: 'in_production',
  READY: 'ready',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
} as const

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS]

// Quote Status
export const QUOTE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const

export type QuoteStatus = typeof QUOTE_STATUS[keyof typeof QUOTE_STATUS]

// Delivery Type
export const DELIVERY_TYPE = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
} as const

export type DeliveryType = typeof DELIVERY_TYPE[keyof typeof DELIVERY_TYPE]

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  PRODUCTION: 'production',
  SALES: 'sales',
  ACCOUNTANT: 'accountant',
  VIEWER: 'viewer',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

// Product Configuration
export const MIN_PORTIONS = 10
export const MAX_PORTIONS = 100
export const DEFAULT_PREPARATION_DAYS = 5
export const DEFAULT_MAX_ORDERS_PER_DAY = 5

// Event Types
export const EVENT_TYPES = [
  'wedding',
  'quinceanera',
  'birthday',
  'corporate',
  'anniversary',
  'baby_shower',
  'other',
] as const

export type EventType = typeof EVENT_TYPES[number]
