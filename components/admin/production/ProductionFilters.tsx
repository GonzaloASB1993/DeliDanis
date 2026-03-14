'use client'

import { cn } from '@/lib/utils/cn'
import type { ProductionFilters as Filters, ViewMode } from '@/lib/supabase/production-queries'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'in_progress', label: 'En Proceso' },
  { value: 'completed', label: 'Completados' },
  { value: 'cancelled', label: 'Cancelados' },
]

const PRODUCT_TYPE_OPTIONS = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'cake', label: 'Tortas' },
  { value: 'cocktail', label: 'Cocteleria' },
  { value: 'pastry', label: 'Pasteleria' },
]

interface ProductionFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  totalCount: number
  filteredCount: number
  overdueCount: number
}

export function ProductionFilters({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
  overdueCount,
}: ProductionFiltersProps) {
  const today = new Date().toISOString().split('T')[0]

  const handleDateQuickFilter = (type: 'today' | 'week' | 'overdue') => {
    const now = new Date()
    if (type === 'today') {
      onFiltersChange({ ...filters, eventDateFrom: today, eventDateTo: today })
    } else if (type === 'week') {
      const endOfWeek = new Date(now)
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()))
      onFiltersChange({ ...filters, eventDateFrom: today, eventDateTo: endOfWeek.toISOString().split('T')[0] })
    } else if (type === 'overdue') {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      onFiltersChange({ ...filters, eventDateFrom: undefined, eventDateTo: yesterday.toISOString().split('T')[0] })
    }
  }

  const clearDateFilter = () => {
    onFiltersChange({ ...filters, eventDateFrom: undefined, eventDateTo: undefined })
  }

  const hasDateFilter = filters.eventDateFrom || filters.eventDateTo

  return (
    <div className="bg-white rounded-xl border border-border p-4 space-y-4">
      {/* Row 1: Search + Product Type + View Toggle */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        {/* Search */}
        <div className="relative flex-1 w-full md:max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar producto, SKU, pedido..."
            value={filters.search || ''}
            onChange={e => onFiltersChange({ ...filters, search: e.target.value || undefined })}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Product Type */}
        <select
          value={filters.productType || 'all'}
          onChange={e => onFiltersChange({ ...filters, productType: e.target.value === 'all' ? undefined : e.target.value as any })}
          className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {PRODUCT_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Spacer */}
        <div className="flex-1 hidden md:block" />

        {/* View Toggle */}
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => onViewModeChange('kanban')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'kanban' ? 'bg-primary text-white' : 'bg-white text-dark-light hover:bg-secondary'
            )}
            title="Vista Kanban"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-dark-light hover:bg-secondary'
            )}
            title="Vista Lista"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange('timeline')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'timeline' ? 'bg-primary text-white' : 'bg-white text-dark-light hover:bg-secondary'
            )}
            title="Vista Timeline"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Row 2: Status Pills + Date Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onFiltersChange({ ...filters, status: opt.value === 'all' ? undefined : opt.value })}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                (filters.status || 'all') === (opt.value === 'all' ? undefined : opt.value) ||
                (!filters.status && opt.value === 'all')
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-dark-light hover:bg-primary/10'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDateQuickFilter('today')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              filters.eventDateFrom === today && filters.eventDateTo === today
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-dark-light hover:bg-secondary'
            )}
          >
            Hoy
          </button>
          <button
            onClick={() => handleDateQuickFilter('week')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-dark-light hover:bg-secondary transition-colors"
          >
            Esta Semana
          </button>
          <button
            onClick={() => handleDateQuickFilter('overdue')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1.5',
              'border-border text-dark-light hover:bg-secondary'
            )}
          >
            Vencidos
            {overdueCount > 0 && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
          {hasDateFilter && (
            <button
              onClick={clearDateFilter}
              className="px-2 py-1.5 text-xs text-dark-light hover:text-dark transition-colors"
              title="Limpiar filtro de fecha"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-dark-light">
        Mostrando {filteredCount} de {totalCount} ordenes
      </p>
    </div>
  )
}
