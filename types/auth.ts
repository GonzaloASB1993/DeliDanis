// Tipos para el sistema de autenticación

export type UserRole = 'admin' | 'manager' | 'production' | 'sales' | 'accountant' | 'viewer'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Permisos por rol
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'], // Acceso total
  manager: [
    'dashboard.view',
    'orders.view', 'orders.edit', 'orders.create',
    'products.view', 'products.edit', 'products.create',
    'customers.view', 'customers.edit',
    'reports.view',
    'inventory.view', 'inventory.edit',
    'gallery.view', 'gallery.edit',
    'testimonials.view', 'testimonials.edit',
  ],
  production: [
    'dashboard.view',
    'orders.view', 'orders.edit',
    'inventory.view', 'inventory.edit',
    'products.view',
  ],
  sales: [
    'dashboard.view',
    'orders.view', 'orders.edit', 'orders.create',
    'customers.view', 'customers.edit', 'customers.create',
    'products.view',
    'quotes.view', 'quotes.edit', 'quotes.create',
  ],
  accountant: [
    'dashboard.view',
    'orders.view',
    'reports.view', 'reports.export',
    'customers.view',
    'transactions.view', 'transactions.edit', 'transactions.create',
  ],
  viewer: [
    'dashboard.view',
    'orders.view',
    'products.view',
    'customers.view',
  ],
}

// Helper para verificar permisos
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  if (permissions.includes('*')) return true
  return permissions.includes(permission)
}

// Nombres de roles en español
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  production: 'Producción',
  sales: 'Ventas',
  accountant: 'Contabilidad',
  viewer: 'Visualizador',
}
