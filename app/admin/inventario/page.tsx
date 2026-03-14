'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/admin/Header'
import { IngredientFormModal } from '@/components/admin/inventory/IngredientFormModal'
import { MovementFormModal } from '@/components/admin/inventory/MovementFormModal'
import { RecipeEditor } from '@/components/admin/inventory/RecipeEditor'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  getMovements,
  createMovement,
  getLowStockIngredients,
  getIngredientCategories,
  getInventoryValue,
  getWasteStats,
  type Ingredient,
  type InventoryMovement,
} from '@/lib/supabase/inventory-queries'

type Tab = 'ingredients' | 'movements' | 'recipes'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'ingredients',
    label: 'Insumos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'movements',
    label: 'Movimientos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
  },
  {
    id: 'recipes',
    label: 'Recetas',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
]

const MOVEMENT_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  in: { label: 'Entrada', color: 'text-green-700', bgColor: 'bg-green-100' },
  out: { label: 'Salida', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  waste: { label: 'Merma', color: 'text-red-700', bgColor: 'bg-red-100' },
  adjustment: { label: 'Ajuste', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
}

export default function InventarioPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ingredients')

  // Data
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Stats
  const [stats, setStats] = useState({
    totalActive: 0,
    lowStockCount: 0,
    inventoryValue: 0,
    wasteCount: 0,
    wasteCost: 0,
  })

  // Ingredient filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [filterActiveOnly, setFilterActiveOnly] = useState(true)

  // Movement filters
  const [mvFilterIngredient, setMvFilterIngredient] = useState('')
  const [mvFilterType, setMvFilterType] = useState('')
  const [mvFilterDateFrom, setMvFilterDateFrom] = useState('')
  const [mvFilterDateTo, setMvFilterDateTo] = useState('')

  // Modals
  const [showIngredientModal, setShowIngredientModal] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [movementIngredientId, setMovementIngredientId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const now = new Date()
    try {
      const [ings, allIngs, cats, lowStock, invValue, waste] = await Promise.all([
        getIngredients({
          search: searchTerm,
          category: filterCategory,
          lowStockOnly: filterLowStock,
          activeOnly: filterActiveOnly,
        }),
        getIngredients({ activeOnly: false }),
        getIngredientCategories(),
        getLowStockIngredients(),
        getInventoryValue(),
        getWasteStats(now.getMonth() + 1, now.getFullYear()),
      ])

      setIngredients(ings)
      setAllIngredients(allIngs)
      setCategories(cats)
      setStats({
        totalActive: allIngs.filter(i => i.is_active).length,
        lowStockCount: lowStock.length,
        inventoryValue: invValue,
        wasteCount: waste.totalWasteCount,
        wasteCost: waste.totalWasteCost,
      })
    } catch (error) {
      console.error('Error loading inventory data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, filterCategory, filterLowStock, filterActiveOnly])

  const loadMovements = useCallback(async () => {
    try {
      const mvs = await getMovements({
        ingredientId: mvFilterIngredient || undefined,
        type: mvFilterType || undefined,
        dateFrom: mvFilterDateFrom || undefined,
        dateTo: mvFilterDateTo || undefined,
      })
      setMovements(mvs)
    } catch (error) {
      console.error('Error loading movements:', error)
    }
  }, [mvFilterIngredient, mvFilterType, mvFilterDateFrom, mvFilterDateTo])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (activeTab === 'movements') {
      loadMovements()
    }
  }, [activeTab, loadMovements])

  // Handlers
  const handleCreateIngredient = async (data: any) => {
    const result = await createIngredient(data)
    if (result) {
      setShowIngredientModal(false)
      setEditingIngredient(null)
      loadData()
    }
  }

  const handleUpdateIngredient = async (data: any) => {
    if (!editingIngredient) return
    const success = await updateIngredient(editingIngredient.id, data)
    if (success) {
      setShowIngredientModal(false)
      setEditingIngredient(null)
      loadData()
    }
  }

  const handleDeleteIngredient = async (id: string) => {
    if (!confirm('¿Eliminar este insumo? Se eliminarán también sus movimientos y recetas asociadas.')) return
    const success = await deleteIngredient(id)
    if (success) loadData()
  }

  const handleCreateMovement = async (data: any) => {
    const success = await createMovement(data)
    if (success) {
      setShowMovementModal(false)
      setMovementIngredientId(null)
      loadData()
      if (activeTab === 'movements') loadMovements()
    }
  }

  const openMovementFor = (ingredientId: string) => {
    setMovementIngredientId(ingredientId)
    setShowMovementModal(true)
  }

  const openEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient)
    setShowIngredientModal(true)
  }

  const openNewIngredient = () => {
    setEditingIngredient(null)
    setShowIngredientModal(true)
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Inventario"
        subtitle="Control de stock, movimientos y recetas"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setMovementIngredientId(null)
                setShowMovementModal(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Movimiento
            </button>
            <button
              onClick={openNewIngredient}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Insumo
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-5 border border-border">
            <p className="text-dark-light text-sm">Total Insumos</p>
            <p className="text-2xl font-bold text-dark mt-1">{stats.totalActive}</p>
            <p className="text-xs text-dark-light">activos</p>
          </div>
          <div className={cn(
            'rounded-xl p-5 border',
            stats.lowStockCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-border'
          )}>
            <p className={cn('text-sm', stats.lowStockCount > 0 ? 'text-orange-700' : 'text-dark-light')}>
              Stock Bajo
            </p>
            <p className={cn('text-2xl font-bold mt-1', stats.lowStockCount > 0 ? 'text-orange-600' : 'text-dark')}>
              {stats.lowStockCount}
            </p>
            <p className={cn('text-xs', stats.lowStockCount > 0 ? 'text-orange-600' : 'text-dark-light')}>
              requieren atención
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-border">
            <p className="text-dark-light text-sm">Valor Inventario</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.inventoryValue)}</p>
            <p className="text-xs text-dark-light">stock actual × costo</p>
          </div>
          <div className={cn(
            'rounded-xl p-5 border',
            stats.wasteCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-border'
          )}>
            <p className={cn('text-sm', stats.wasteCount > 0 ? 'text-red-700' : 'text-dark-light')}>
              Mermas del Mes
            </p>
            <p className={cn('text-2xl font-bold mt-1', stats.wasteCount > 0 ? 'text-red-600' : 'text-dark')}>
              {stats.wasteCount}
            </p>
            <p className={cn('text-xs', stats.wasteCount > 0 ? 'text-red-600' : 'text-dark-light')}>
              registros de merma
            </p>
          </div>
          <div className={cn(
            'rounded-xl p-5 border',
            stats.wasteCost > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-border'
          )}>
            <p className={cn('text-sm', stats.wasteCost > 0 ? 'text-red-700' : 'text-dark-light')}>
              Costo Mermas
            </p>
            <p className={cn('text-2xl font-bold mt-1', stats.wasteCost > 0 ? 'text-red-600' : 'text-dark')}>
              {formatCurrency(stats.wasteCost)}
            </p>
            <p className={cn('text-xs', stats.wasteCost > 0 ? 'text-red-600' : 'text-dark-light')}>
              pérdida estimada
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'ingredients' && (
          <IngredientsTab
            ingredients={ingredients}
            categories={categories}
            isLoading={isLoading}
            searchTerm={searchTerm}
            filterCategory={filterCategory}
            filterLowStock={filterLowStock}
            filterActiveOnly={filterActiveOnly}
            onSearchChange={setSearchTerm}
            onCategoryChange={setFilterCategory}
            onLowStockChange={setFilterLowStock}
            onActiveOnlyChange={setFilterActiveOnly}
            onEdit={openEditIngredient}
            onDelete={handleDeleteIngredient}
            onMovement={openMovementFor}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsTab
            movements={movements}
            allIngredients={allIngredients}
            mvFilterIngredient={mvFilterIngredient}
            mvFilterType={mvFilterType}
            mvFilterDateFrom={mvFilterDateFrom}
            mvFilterDateTo={mvFilterDateTo}
            onFilterIngredient={setMvFilterIngredient}
            onFilterType={setMvFilterType}
            onFilterDateFrom={setMvFilterDateFrom}
            onFilterDateTo={setMvFilterDateTo}
            onNewMovement={() => {
              setMovementIngredientId(null)
              setShowMovementModal(true)
            }}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipeEditor ingredients={allIngredients.filter(i => i.is_active)} />
        )}
      </div>

      {/* Ingredient Modal */}
      {showIngredientModal && (
        <IngredientFormModal
          ingredient={editingIngredient}
          onClose={() => {
            setShowIngredientModal(false)
            setEditingIngredient(null)
          }}
          onSave={editingIngredient ? handleUpdateIngredient : handleCreateIngredient}
        />
      )}

      {/* Movement Modal */}
      {showMovementModal && (
        <MovementFormModal
          ingredients={allIngredients.filter(i => i.is_active)}
          preselectedIngredientId={movementIngredientId}
          onClose={() => {
            setShowMovementModal(false)
            setMovementIngredientId(null)
          }}
          onSave={handleCreateMovement}
        />
      )}
    </div>
  )
}

// ============ Ingredients Tab ============

function IngredientsTab({
  ingredients,
  categories,
  isLoading,
  searchTerm,
  filterCategory,
  filterLowStock,
  filterActiveOnly,
  onSearchChange,
  onCategoryChange,
  onLowStockChange,
  onActiveOnlyChange,
  onEdit,
  onDelete,
  onMovement,
}: {
  ingredients: Ingredient[]
  categories: string[]
  isLoading: boolean
  searchTerm: string
  filterCategory: string
  filterLowStock: boolean
  filterActiveOnly: boolean
  onSearchChange: (v: string) => void
  onCategoryChange: (v: string) => void
  onLowStockChange: (v: boolean) => void
  onActiveOnlyChange: (v: boolean) => void
  onEdit: (i: Ingredient) => void
  onDelete: (id: string) => void
  onMovement: (id: string) => void
}) {
  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar insumos..."
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <select
            value={filterCategory}
            onChange={e => onCategoryChange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 border border-gray-200 rounded-lg hover:bg-secondary transition-colors">
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={e => onLowStockChange(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-dark whitespace-nowrap">Solo stock bajo</span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 border border-gray-200 rounded-lg hover:bg-secondary transition-colors">
            <input
              type="checkbox"
              checked={filterActiveOnly}
              onChange={e => onActiveOnlyChange(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-dark whitespace-nowrap">Solo activos</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-dark-light">Cargando...</div>
        ) : ingredients.length === 0 ? (
          <div className="p-8 text-center text-dark-light">
            <svg className="w-12 h-12 mx-auto mb-3 text-dark-light/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p>No se encontraron insumos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary text-sm text-dark-light">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Nombre</th>
                  <th className="text-left px-5 py-3 font-medium">Categoría</th>
                  <th className="text-left px-5 py-3 font-medium">Stock</th>
                  <th className="text-left px-5 py-3 font-medium">Unidad</th>
                  <th className="text-right px-5 py-3 font-medium">Costo Unit.</th>
                  <th className="text-left px-5 py-3 font-medium">Proveedor</th>
                  <th className="text-center px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ingredients.map(ingredient => {
                  const isLow = ingredient.min_stock > 0 && ingredient.current_stock <= ingredient.min_stock
                  const stockPercent = ingredient.min_stock > 0
                    ? Math.min((ingredient.current_stock / (ingredient.min_stock * 2)) * 100, 100)
                    : 100

                  return (
                    <tr
                      key={ingredient.id}
                      className={cn(
                        'hover:bg-secondary/50 transition-colors',
                        isLow && 'bg-orange-50/50'
                      )}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-dark">{ingredient.name}</span>
                          {!ingredient.is_active && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Inactivo</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-dark-light">
                        {ingredient.category || '-'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24">
                            <div className="flex justify-between text-xs mb-1">
                              <span className={cn(
                                'font-medium',
                                isLow ? 'text-orange-600' : 'text-dark'
                              )}>
                                {ingredient.current_stock}
                              </span>
                              {ingredient.min_stock > 0 && (
                                <span className="text-dark-light">mín: {ingredient.min_stock}</span>
                              )}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={cn(
                                  'h-1.5 rounded-full transition-all',
                                  isLow ? 'bg-orange-500' : stockPercent > 60 ? 'bg-green-500' : 'bg-yellow-500'
                                )}
                                style={{ width: `${Math.max(stockPercent, 3)}%` }}
                              />
                            </div>
                          </div>
                          {isLow && (
                            <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-dark-light">{ingredient.unit}</td>
                      <td className="px-5 py-4 text-right text-sm text-dark">
                        {formatCurrency(ingredient.unit_cost)}
                      </td>
                      <td className="px-5 py-4 text-sm text-dark-light">
                        {ingredient.supplier || '-'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEdit(ingredient)}
                            className="p-1.5 hover:bg-secondary rounded-lg text-dark-light hover:text-dark transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onMovement(ingredient.id)}
                            className="p-1.5 hover:bg-secondary rounded-lg text-dark-light hover:text-primary transition-colors"
                            title="Registrar movimiento"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDelete(ingredient.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-dark-light hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

// ============ Movements Tab ============

function MovementsTab({
  movements,
  allIngredients,
  mvFilterIngredient,
  mvFilterType,
  mvFilterDateFrom,
  mvFilterDateTo,
  onFilterIngredient,
  onFilterType,
  onFilterDateFrom,
  onFilterDateTo,
  onNewMovement,
}: {
  movements: InventoryMovement[]
  allIngredients: Ingredient[]
  mvFilterIngredient: string
  mvFilterType: string
  mvFilterDateFrom: string
  mvFilterDateTo: string
  onFilterIngredient: (v: string) => void
  onFilterType: (v: string) => void
  onFilterDateFrom: (v: string) => void
  onFilterDateTo: (v: string) => void
  onNewMovement: () => void
}) {
  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={mvFilterIngredient}
            onChange={e => onFilterIngredient(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">Todos los insumos</option>
            {allIngredients.map(ing => (
              <option key={ing.id} value={ing.id}>{ing.name}</option>
            ))}
          </select>

          <select
            value={mvFilterType}
            onChange={e => onFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">Todos los tipos</option>
            <option value="in">Entrada</option>
            <option value="out">Salida</option>
            <option value="waste">Merma</option>
            <option value="adjustment">Ajuste</option>
          </select>

          <input
            type="date"
            value={mvFilterDateFrom}
            onChange={e => onFilterDateFrom(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="Desde"
          />

          <input
            type="date"
            value={mvFilterDateTo}
            onChange={e => onFilterDateTo(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="Hasta"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {movements.length === 0 ? (
          <div className="p-8 text-center text-dark-light">
            <svg className="w-12 h-12 mx-auto mb-3 text-dark-light/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <p>No hay movimientos registrados.</p>
            <button
              onClick={onNewMovement}
              className="mt-2 text-primary hover:text-primary-hover text-sm font-medium"
            >
              Registrar primer movimiento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary text-sm text-dark-light">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Fecha</th>
                  <th className="text-left px-5 py-3 font-medium">Insumo</th>
                  <th className="text-left px-5 py-3 font-medium">Tipo</th>
                  <th className="text-right px-5 py-3 font-medium">Cantidad</th>
                  <th className="text-right px-5 py-3 font-medium">Costo</th>
                  <th className="text-left px-5 py-3 font-medium">Referencia</th>
                  <th className="text-left px-5 py-3 font-medium">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map(mv => {
                  const typeConfig = MOVEMENT_TYPE_CONFIG[mv.movement_type]
                  const ing = mv.ingredient as any
                  return (
                    <tr key={mv.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-5 py-4 text-sm text-dark">
                        {formatDate(mv.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-dark">{ing?.name || '-'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                          typeConfig?.bgColor,
                          typeConfig?.color
                        )}>
                          {typeConfig?.label || mv.movement_type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-sm">
                        <span className={cn(
                          'font-medium',
                          mv.movement_type === 'in' ? 'text-green-600' :
                          mv.movement_type === 'waste' ? 'text-red-600' :
                          'text-dark'
                        )}>
                          {mv.movement_type === 'in' ? '+' : mv.movement_type === 'adjustment' ? '=' : '-'}
                          {mv.quantity} {ing?.unit || ''}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-dark-light">
                        {mv.unit_cost ? formatCurrency(mv.unit_cost) : '-'}
                      </td>
                      <td className="px-5 py-4 text-sm text-dark-light">
                        {mv.reference || '-'}
                      </td>
                      <td className="px-5 py-4 text-sm text-dark-light max-w-[200px] truncate">
                        {mv.notes || '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
