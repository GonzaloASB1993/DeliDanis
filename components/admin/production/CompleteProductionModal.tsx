'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  completeProduction,
  checkStockForProduction,
  type ProductionOrder,
  type ProductionMovement,
} from '@/lib/supabase/production-queries'

interface CompleteProductionModalProps {
  productionOrder: ProductionOrder
  onClose: () => void
  onCompleted: () => void
}

interface MovementRow {
  id: string
  ingredient_id: string
  ingredient_name: string
  unit: string
  planned_quantity: number
  actual_quantity: string
  waste_quantity: string
  current_stock: number
}

export function CompleteProductionModal({
  productionOrder,
  onClose,
  onCompleted,
}: CompleteProductionModalProps) {
  const [rows, setRows] = useState<MovementRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasStockWarning, setHasStockWarning] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const stockCheck = await checkStockForProduction(productionOrder.id)
      const movements = productionOrder.movements || []

      const mappedRows: MovementRow[] = movements.map(mov => {
        const stockInfo = stockCheck.find(s => s.ingredient_id === mov.ingredient_id)
        return {
          id: mov.id,
          ingredient_id: mov.ingredient_id,
          ingredient_name: (mov.ingredient as any)?.name || stockInfo?.ingredient_name || 'Desconocido',
          unit: (mov.ingredient as any)?.unit || stockInfo?.unit || '',
          planned_quantity: mov.planned_quantity,
          actual_quantity: mov.planned_quantity.toString(),
          waste_quantity: '0',
          current_stock: (mov.ingredient as any)?.current_stock ?? stockInfo?.current_stock ?? 0,
        }
      })

      setRows(mappedRows)
      setHasStockWarning(stockCheck.some(s => !s.sufficient))
    } catch (error) {
      console.error('Error loading stock data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateRow = (index: number, field: 'actual_quantity' | 'waste_quantity', value: string) => {
    setRows(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const movementData = rows.map(row => ({
        id: row.id,
        ingredient_id: row.ingredient_id,
        actual_quantity: parseFloat(row.actual_quantity) || 0,
        waste_quantity: parseFloat(row.waste_quantity) || 0,
      }))

      const success = await completeProduction(productionOrder.id, movementData)
      if (success) {
        onCompleted()
      }
    } catch (error) {
      console.error('Error completing production:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const isRowOverStock = (row: MovementRow) => {
    const actual = parseFloat(row.actual_quantity) || 0
    const waste = parseFloat(row.waste_quantity) || 0
    return (actual + waste) > row.current_stock
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-display font-bold text-dark">Completar Producción</h2>
            <p className="text-sm text-dark-light">
              {productionOrder.product_name} — {productionOrder.sku}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg text-dark-light">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Warning */}
            {hasStockWarning && (
              <div className="mx-6 mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-sm text-warning font-medium">
                  Algunos ingredientes tienen stock insuficiente para la cantidad planificada.
                </p>
              </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-y-auto p-6">
              {rows.length === 0 ? (
                <div className="text-center py-8 text-dark-light">
                  <p>Esta producción no tiene receta asociada.</p>
                  <p className="text-sm mt-1">No se descontará inventario al completar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 font-medium text-dark-light">Ingrediente</th>
                        <th className="pb-2 font-medium text-dark-light text-right">Planificado</th>
                        <th className="pb-2 font-medium text-dark-light text-center">Real</th>
                        <th className="pb-2 font-medium text-dark-light text-center">Merma</th>
                        <th className="pb-2 font-medium text-dark-light text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {rows.map((row, index) => (
                        <tr
                          key={row.id}
                          className={cn(
                            'transition-colors',
                            isRowOverStock(row) && 'bg-red-50'
                          )}
                        >
                          <td className="py-2 pr-3">
                            <span className="font-medium text-dark">{row.ingredient_name}</span>
                            <span className="text-dark-light ml-1">({row.unit})</span>
                          </td>
                          <td className="py-2 text-right font-mono text-dark-light">
                            {row.planned_quantity.toFixed(2)}
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={row.actual_quantity}
                              onChange={e => updateRow(index, 'actual_quantity', e.target.value)}
                              className="w-24 px-2 py-1 border border-gray-200 rounded text-center focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={row.waste_quantity}
                              onChange={e => updateRow(index, 'waste_quantity', e.target.value)}
                              className="w-24 px-2 py-1 border border-gray-200 rounded text-center focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                          </td>
                          <td className={cn(
                            'py-2 text-right font-mono',
                            isRowOverStock(row) ? 'text-red-600 font-semibold' : 'text-dark-light'
                          )}>
                            {row.current_stock.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-secondary">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-dark-light hover:bg-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Completando...' : 'Completar Producción'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
