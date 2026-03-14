'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header, StatCard } from '@/components/admin/Header'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format'
import {
  getProductionOrders,
  getProductionStats,
  startProduction,
  cancelProduction,
  batchStartProduction,
  batchCancelProduction,
  getProductionOrderById,
  type ProductionOrder,
  type ProductionFilters as Filters,
  type ProductionStats,
  type ViewMode,
} from '@/lib/supabase/production-queries'
import { NewProductionModal } from '@/components/admin/production/NewProductionModal'
import { ProductionDetailModal } from '@/components/admin/production/ProductionDetailModal'
import { CompleteProductionModal } from '@/components/admin/production/CompleteProductionModal'
import { ProductionFilters } from '@/components/admin/production/ProductionFilters'
import { ProductionKanban } from '@/components/admin/production/ProductionKanban'
import { ProductionTable } from '@/components/admin/production/ProductionTable'
import { ProductionTimeline } from '@/components/admin/production/ProductionTimeline'
import { ProductionBatchBar } from '@/components/admin/production/ProductionBatchBar'

const DEFAULT_STATS: ProductionStats = {
  pending: 0,
  inProgress: 0,
  completedToday: 0,
  monthlyWaste: 0,
  overdue: 0,
  efficiencyPercent: 100,
  monthlyWasteCost: 0,
}

export default function ProduccionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [allOrders, setAllOrders] = useState<ProductionOrder[]>([])
  const [stats, setStats] = useState<ProductionStats>(DEFAULT_STATS)
  const [isLoading, setIsLoading] = useState(true)

  // Filters & View
  const [filters, setFilters] = useState<Filters>({})
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modals
  const [showNewModal, setShowNewModal] = useState(false)
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null)
  const [completeOrder, setCompleteOrder] = useState<ProductionOrder | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const now = new Date()
      const [ordersData, allData, statsData] = await Promise.all([
        getProductionOrders(filters),
        getProductionOrders({}),
        getProductionStats(now.getMonth() + 1, now.getFullYear()),
      ])
      setOrders(ordersData)
      setAllOrders(allData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading production data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set())
  }, [filters, viewMode])

  // === Handlers ===

  const handleStart = async (id: string) => {
    const success = await startProduction(id)
    if (success) loadData()
  }

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar esta produccion?')) return
    const success = await cancelProduction(id)
    if (success) loadData()
  }

  const handleOpenComplete = async (id: string) => {
    const fullOrder = await getProductionOrderById(id)
    if (fullOrder) setCompleteOrder(fullOrder)
  }

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = () => {
    if (orders.every(o => selectedIds.has(o.id))) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(orders.map(o => o.id)))
    }
  }

  const handleBatchStart = async () => {
    const ids = Array.from(selectedIds)
    const success = await batchStartProduction(ids)
    if (success) {
      setSelectedIds(new Set())
      loadData()
    }
  }

  const handleBatchCancel = async () => {
    if (!confirm(`¿Cancelar ${selectedIds.size} produccion(es)?`)) return
    const ids = Array.from(selectedIds)
    const success = await batchCancelProduction(ids)
    if (success) {
      setSelectedIds(new Set())
      loadData()
    }
  }

  const handleBatchStartAllPending = async () => {
    const pendingIds = orders.filter(o => o.status === 'pending').map(o => o.id)
    if (pendingIds.length === 0) return
    const success = await batchStartProduction(pendingIds)
    if (success) loadData()
  }

  // Check if all selected are pending
  const allSelectedPending = Array.from(selectedIds).every(id => {
    const order = orders.find(o => o.id === id)
    return order?.status === 'pending'
  })

  return (
    <div className="min-h-screen">
      <Header
        title="Produccion"
        subtitle="Control de produccion y preparacion"
        actions={
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
          >
            + Nueva Produccion
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Row 1 - 4 colored cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Pendientes"
            value={stats.pending}
            color="yellow"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="En Proceso"
            value={stats.inProgress}
            color="blue"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            }
          />
          <StatCard
            label="Completados Hoy"
            value={stats.completedToday}
            color="green"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Urgentes"
            value={stats.overdue}
            color="coral"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            }
          />
        </div>

        {/* Stats Row 2 - 2 insight cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-light font-medium">Eficiencia de Produccion</p>
                <p className="text-2xl font-bold text-dark mt-1">{stats.efficiencyPercent}%</p>
                <p className="text-xs text-dark-light mt-1">Uso real vs planificado de insumos</p>
              </div>
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                stats.efficiencyPercent >= 90 ? 'bg-green-100' :
                stats.efficiencyPercent >= 70 ? 'bg-yellow-100' :
                'bg-red-100'
              )}>
                <svg className={cn(
                  'w-6 h-6',
                  stats.efficiencyPercent >= 90 ? 'text-green-600' :
                  stats.efficiencyPercent >= 70 ? 'text-yellow-600' :
                  'text-red-600'
                )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className={cn(
            'rounded-xl border p-5',
            stats.monthlyWasteCost > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-border'
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-light font-medium">Mermas del Mes</p>
                <p className="text-2xl font-bold text-dark mt-1">
                  {stats.monthlyWaste.toFixed(1)} <span className="text-sm font-normal text-dark-light">unidades</span>
                </p>
                <p className={cn('text-xs mt-1', stats.monthlyWasteCost > 0 ? 'text-red-600 font-medium' : 'text-dark-light')}>
                  Costo: {formatCurrency(stats.monthlyWasteCost)}
                </p>
              </div>
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                stats.monthlyWasteCost > 0 ? 'bg-red-100' : 'bg-gray-100'
              )}>
                <svg className={cn('w-6 h-6', stats.monthlyWasteCost > 0 ? 'text-red-600' : 'text-dark-light')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <ProductionFilters
          filters={filters}
          onFiltersChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalCount={allOrders.length}
          filteredCount={orders.length}
          overdueCount={stats.overdue}
        />

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {viewMode === 'kanban' && (
              <ProductionKanban
                orders={orders}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onDetail={setDetailOrderId}
                onStart={handleStart}
                onComplete={handleOpenComplete}
                onCancel={handleCancel}
                onBatchStartAll={handleBatchStartAllPending}
              />
            )}

            {viewMode === 'list' && (
              <ProductionTable
                orders={orders}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onSelectAll={handleSelectAll}
                onDetail={setDetailOrderId}
                onStart={handleStart}
                onComplete={handleOpenComplete}
                onCancel={handleCancel}
                filters={filters}
                onFiltersChange={setFilters}
              />
            )}

            {viewMode === 'timeline' && (
              <ProductionTimeline
                orders={orders}
                onDetail={setDetailOrderId}
              />
            )}
          </>
        )}
      </div>

      {/* Batch Bar */}
      <ProductionBatchBar
        selectedCount={selectedIds.size}
        allPending={allSelectedPending}
        onStartAll={handleBatchStart}
        onCancelAll={handleBatchCancel}
        onDeselectAll={() => setSelectedIds(new Set())}
      />

      {/* Modals */}
      {showNewModal && (
        <NewProductionModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => {
            setShowNewModal(false)
            loadData()
          }}
        />
      )}

      {detailOrderId && (
        <ProductionDetailModal
          productionOrderId={detailOrderId}
          onClose={() => setDetailOrderId(null)}
        />
      )}

      {completeOrder && (
        <CompleteProductionModal
          productionOrder={completeOrder}
          onClose={() => setCompleteOrder(null)}
          onCompleted={() => {
            setCompleteOrder(null)
            loadData()
          }}
        />
      )}
    </div>
  )
}
