'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/admin/Header'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/format'
import {
  getUsers,
  getUserStats,
  createUserWithProfile,
  updateUserProfile,
  toggleUserActive,
  type UserWithProfile,
  type UserStats,
} from '@/lib/supabase/user-queries'
import {
  type UserRole,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
} from '@/types/auth'

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_ROLES: UserRole[] = ['admin', 'manager', 'production', 'sales', 'accountant', 'viewer']

const ROLE_BADGE: Record<UserRole, string> = {
  admin:      'bg-purple-100 text-purple-700',
  manager:    'bg-blue-100 text-blue-700',
  production: 'bg-orange-100 text-orange-700',
  sales:      'bg-green-100 text-green-700',
  accountant: 'bg-yellow-100 text-yellow-700',
  viewer:     'bg-gray-100 text-gray-700',
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateFormData {
  email: string
  password: string
  first_name: string
  last_name: string
  role: UserRole
  phone: string
}

interface EditFormData {
  first_name: string
  last_name: string
  phone: string
  role: UserRole
  is_active: boolean
}

const EMPTY_CREATE: CreateFormData = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'viewer',
  phone: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(user: UserWithProfile): string {
  const f = user.first_name?.[0] ?? ''
  const l = user.last_name?.[0] ?? ''
  return (f + l).toUpperCase() || user.email[0]?.toUpperCase() || 'U'
}

function getFullName(user: UserWithProfile): string {
  const parts = [user.first_name, user.last_name].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : '—'
}

function formatPermission(perm: string): string {
  // 'orders.create' → 'Pedidos: Crear'
  const MODULE_LABELS: Record<string, string> = {
    dashboard:    'Dashboard',
    orders:       'Pedidos',
    products:     'Productos',
    customers:    'Clientes',
    reports:      'Reportes',
    inventory:    'Inventario',
    gallery:      'Galería',
    testimonials: 'Testimonios',
    quotes:       'Cotizaciones',
    transactions: 'Transacciones',
  }
  const ACTION_LABELS: Record<string, string> = {
    view:   'Ver',
    edit:   'Editar',
    create: 'Crear',
    export: 'Exportar',
  }
  const [module, action] = perm.split('.')
  const moduleName = MODULE_LABELS[module] ?? module
  const actionName = ACTION_LABELS[action] ?? action
  return `${moduleName}: ${actionName}`
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserWithProfile[]>([])
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: { admin: 0, manager: 0, production: 0, sales: 0, accountant: 0, viewer: 0 },
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null)

  // Form state
  const [createForm, setCreateForm] = useState<CreateFormData>(EMPTY_CREATE)
  const [editForm, setEditForm] = useState<EditFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    role: 'viewer',
    is_active: true,
  })

  // Feedback
  const [isSaving, setIsSaving] = useState(false)
  const [createError, setCreateError] = useState('')
  const [editError, setEditError] = useState('')

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [usersData, statsData] = await Promise.all([getUsers(), getUserStats()])
      setUsers(usersData)
      setStats(statsData)
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtered list
  const filteredUsers = users.filter(u => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !q ||
      u.email.toLowerCase().includes(q) ||
      (u.first_name ?? '').toLowerCase().includes(q) ||
      (u.last_name ?? '').toLowerCase().includes(q)

    const matchesRole = !filterRole || u.role === filterRole
    const matchesStatus =
      !filterStatus ||
      (filterStatus === 'active' && u.is_active) ||
      (filterStatus === 'inactive' && !u.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const openCreateModal = () => {
    setCreateForm(EMPTY_CREATE)
    setCreateError('')
    setShowCreateModal(true)
  }

  const openEditModal = (user: UserWithProfile) => {
    setSelectedUser(user)
    setEditForm({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      phone: user.phone ?? '',
      role: user.role,
      is_active: user.is_active,
    })
    setEditError('')
    setShowEditModal(true)
  }

  const openPermissionsModal = (user: UserWithProfile) => {
    setSelectedUser(user)
    setShowPermissionsModal(true)
  }

  const openDeactivateConfirm = (user: UserWithProfile) => {
    setSelectedUser(user)
    setShowDeactivateConfirm(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setIsSaving(true)
    try {
      const result = await createUserWithProfile(
        createForm.email,
        createForm.password,
        createForm.role,
        createForm.first_name,
        createForm.last_name,
        createForm.phone || undefined
      )
      if (!result.success) {
        setCreateError(result.error ?? 'Error al crear usuario')
        return
      }
      setShowCreateModal(false)
      await loadData()
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setEditError('')
    setIsSaving(true)
    try {
      const success = await updateUserProfile(selectedUser.id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone: editForm.phone || undefined,
        role: editForm.role,
        is_active: editForm.is_active,
      })
      if (!success) {
        setEditError('No se pudo guardar los cambios')
        return
      }
      setShowEditModal(false)
      await loadData()
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async () => {
    if (!selectedUser) return
    setIsSaving(true)
    try {
      await toggleUserActive(selectedUser.id, !selectedUser.is_active)
      setShowDeactivateConfirm(false)
      await loadData()
    } finally {
      setIsSaving(false)
    }
  }

  const handleQuickToggleActive = (user: UserWithProfile) => {
    if (user.is_active) {
      openDeactivateConfirm(user)
    } else {
      // Activating doesn't need confirmation
      setSelectedUser(user)
      toggleUserActive(user.id, true).then(() => loadData())
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      <Header
        title="Usuarios"
        subtitle="Gestión de accesos y roles del panel administrativo"
        actions={
          <Button size="sm" onClick={openCreateModal}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Usuario
          </Button>
        }
      />

      <div className="p-6 space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl border border-border p-5 col-span-1">
            <p className="text-dark-light text-sm">Total</p>
            <p className="text-2xl font-bold text-dark mt-1">{stats.total}</p>
            <p className="text-xs text-dark-light">usuarios</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-5 col-span-1">
            <p className="text-dark-light text-sm">Activos</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
            <p className="text-xs text-dark-light">con acceso</p>
          </div>
          <div className={cn(
            'rounded-xl border p-5 col-span-1',
            stats.inactive > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-border'
          )}>
            <p className={cn('text-sm', stats.inactive > 0 ? 'text-red-700' : 'text-dark-light')}>Inactivos</p>
            <p className={cn('text-2xl font-bold mt-1', stats.inactive > 0 ? 'text-red-600' : 'text-dark')}>
              {stats.inactive}
            </p>
            <p className={cn('text-xs', stats.inactive > 0 ? 'text-red-600' : 'text-dark-light')}>sin acceso</p>
          </div>
          {/* Role breakdown — show admin, manager, production */}
          {(['admin', 'manager', 'production'] as UserRole[]).map(role => (
            <div key={role} className="bg-white rounded-xl border border-border p-5 col-span-1">
              <p className="text-dark-light text-sm">{ROLE_LABELS[role]}</p>
              <p className="text-2xl font-bold text-dark mt-1">{stats.byRole[role]}</p>
              <p className="text-xs text-dark-light">usuarios</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-light/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
            </div>
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white"
            >
              <option value="">Todos los roles</option>
              {ALL_ROLES.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-dark-light">
              <svg className="animate-spin w-8 h-8 mx-auto mb-3 text-primary/40" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Cargando usuarios...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-dark-light/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-dark-light">
                {searchTerm || filterRole || filterStatus
                  ? 'No se encontraron usuarios con los filtros aplicados'
                  : 'No hay usuarios registrados'}
              </p>
              {!searchTerm && !filterRole && !filterStatus && (
                <button
                  onClick={openCreateModal}
                  className="mt-3 text-primary hover:text-primary-hover text-sm font-medium"
                >
                  Crear primer usuario
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary text-xs text-dark-light uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Usuario</th>
                    <th className="text-left px-5 py-3 font-medium">Email</th>
                    <th className="text-left px-5 py-3 font-medium">Rol</th>
                    <th className="text-left px-5 py-3 font-medium">Estado</th>
                    <th className="text-left px-5 py-3 font-medium">Ultimo acceso</th>
                    <th className="text-center px-5 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-secondary/40 transition-colors">
                      {/* Avatar + Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary text-sm font-semibold">
                              {getInitials(user)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-dark">{getFullName(user)}</p>
                            {user.phone && (
                              <p className="text-xs text-dark-light">{user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4">
                        <span className="text-sm text-dark-light">{user.email}</span>
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-4">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          ROLE_BADGE[user.role]
                        )}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                          user.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        )}>
                          <span className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            user.is_active ? 'bg-green-500' : 'bg-gray-400'
                          )} />
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* Last login */}
                      <td className="px-5 py-4">
                        <span className="text-sm text-dark-light">
                          {user.last_sign_in_at
                            ? formatDate(user.last_sign_in_at, { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Nunca'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(user)}
                            title="Editar usuario"
                            className="p-1.5 rounded-lg text-dark-light hover:text-dark hover:bg-secondary transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Permissions */}
                          <button
                            onClick={() => openPermissionsModal(user)}
                            title="Ver permisos"
                            className="p-1.5 rounded-lg text-dark-light hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </button>

                          {/* Toggle active */}
                          <button
                            onClick={() => handleQuickToggleActive(user)}
                            title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              user.is_active
                                ? 'text-dark-light hover:text-red-600 hover:bg-red-50'
                                : 'text-dark-light hover:text-green-600 hover:bg-green-50'
                            )}
                          >
                            {user.is_active ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table footer */}
          {!isLoading && filteredUsers.length > 0 && (
            <div className="px-5 py-3 border-t border-border bg-secondary/30">
              <p className="text-xs text-dark-light">
                {filteredUsers.length} de {users.length} usuario{users.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Create User Modal ──────────────────────────────────────────────── */}
      {showCreateModal && (
        <ModalOverlay onClose={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="font-display text-lg font-semibold text-dark">Nuevo Usuario</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-dark-light hover:text-dark hover:bg-secondary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nombre" required>
                  <input
                    type="text"
                    required
                    value={createForm.first_name}
                    onChange={e => setCreateForm(p => ({ ...p, first_name: e.target.value }))}
                    placeholder="Nombre"
                    className={INPUT_CLS}
                  />
                </FormField>
                <FormField label="Apellido" required>
                  <input
                    type="text"
                    required
                    value={createForm.last_name}
                    onChange={e => setCreateForm(p => ({ ...p, last_name: e.target.value }))}
                    placeholder="Apellido"
                    className={INPUT_CLS}
                  />
                </FormField>
              </div>

              <FormField label="Email" required>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="usuario@delidanis.com"
                  className={INPUT_CLS}
                />
              </FormField>

              <FormField label="Contrasena" required>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={createForm.password}
                  onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Minimo 8 caracteres"
                  className={INPUT_CLS}
                />
              </FormField>

              <FormField label="Rol" required>
                <select
                  required
                  value={createForm.role}
                  onChange={e => setCreateForm(p => ({ ...p, role: e.target.value as UserRole }))}
                  className={INPUT_CLS}
                >
                  {ALL_ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Telefono">
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+57 300 000 0000"
                  className={INPUT_CLS}
                />
              </FormField>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-dark-light hover:text-dark transition-colors"
                >
                  Cancelar
                </button>
                <Button type="submit" size="sm" isLoading={isSaving} disabled={isSaving}>
                  Crear Usuario
                </Button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* ── Edit User Modal ────────────────────────────────────────────────── */}
      {showEditModal && selectedUser && (
        <ModalOverlay onClose={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="font-display text-lg font-semibold text-dark">Editar Usuario</h2>
                <p className="text-xs text-dark-light mt-0.5">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-dark-light hover:text-dark hover:bg-secondary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEdit} className="px-6 py-5 space-y-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {editError}
                </div>
              )}

              {/* Email — read only */}
              <FormField label="Email">
                <input
                  type="email"
                  value={selectedUser.email}
                  readOnly
                  className={cn(INPUT_CLS, 'bg-secondary cursor-not-allowed text-dark-light')}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nombre">
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={e => setEditForm(p => ({ ...p, first_name: e.target.value }))}
                    placeholder="Nombre"
                    className={INPUT_CLS}
                  />
                </FormField>
                <FormField label="Apellido">
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={e => setEditForm(p => ({ ...p, last_name: e.target.value }))}
                    placeholder="Apellido"
                    className={INPUT_CLS}
                  />
                </FormField>
              </div>

              <FormField label="Telefono">
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+57 300 000 0000"
                  className={INPUT_CLS}
                />
              </FormField>

              <FormField label="Rol">
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(p => ({ ...p, role: e.target.value as UserRole }))}
                  className={INPUT_CLS}
                >
                  {ALL_ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </FormField>

              <div className="flex items-center gap-3 py-1">
                <button
                  type="button"
                  onClick={() => setEditForm(p => ({ ...p, is_active: !p.is_active }))}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                    editForm.is_active ? 'bg-green-500' : 'bg-gray-300'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                      editForm.is_active ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
                <span className="text-sm text-dark">
                  Usuario {editForm.is_active ? 'activo' : 'inactivo'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-dark-light hover:text-dark transition-colors"
                >
                  Cancelar
                </button>
                <Button type="submit" size="sm" isLoading={isSaving} disabled={isSaving}>
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* ── Permissions Modal ─────────────────────────────────────────────── */}
      {showPermissionsModal && selectedUser && (
        <ModalOverlay onClose={() => setShowPermissionsModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="font-display text-lg font-semibold text-dark">Permisos del Rol</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    ROLE_BADGE[selectedUser.role]
                  )}>
                    {ROLE_LABELS[selectedUser.role]}
                  </span>
                  <span className="text-xs text-dark-light">— {getFullName(selectedUser)}</span>
                </div>
              </div>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="p-1.5 rounded-lg text-dark-light hover:text-dark hover:bg-secondary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5">
              {ROLE_PERMISSIONS[selectedUser.role].includes('*') ? (
                <div className="flex items-center gap-3 py-4 px-4 bg-purple-50 rounded-xl border border-purple-100">
                  <svg className="w-8 h-8 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-purple-700">Acceso Total</p>
                    <p className="text-xs text-purple-600 mt-0.5">
                      El Administrador tiene permisos sobre todos los modulos del sistema.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-dark-light mb-3 uppercase tracking-wide font-medium">
                    {ROLE_PERMISSIONS[selectedUser.role].length} permisos asignados
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                    {ROLE_PERMISSIONS[selectedUser.role].map(perm => (
                      <div
                        key={perm}
                        className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg"
                      >
                        <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs text-dark">{formatPermission(perm)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-5 flex justify-end">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-5 py-2 text-sm font-medium text-dark-light hover:text-dark border border-border rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Deactivate Confirmation Dialog ────────────────────────────────── */}
      {showDeactivateConfirm && selectedUser && (
        <ModalOverlay onClose={() => setShowDeactivateConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-dark mb-2">Desactivar Usuario</h3>
            <p className="text-sm text-dark-light mb-1">
              Esta accion impedira que{' '}
              <span className="font-medium text-dark">{getFullName(selectedUser)}</span>{' '}
              acceda al panel.
            </p>
            <p className="text-xs text-dark-light mb-6">
              El usuario y sus datos no seran eliminados. Puedes reactivarlo en cualquier momento.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium border border-border rounded-lg text-dark hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <Button
                size="sm"
                onClick={handleToggleActive}
                isLoading={isSaving}
                disabled={isSaving}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Desactivar
              </Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// ─── Shared Sub-components ────────────────────────────────────────────────────

const INPUT_CLS =
  'w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors'

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-dark mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full flex items-center justify-center px-4">
        {children}
      </div>
    </div>
  )
}
