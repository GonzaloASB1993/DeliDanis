'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { getProductionOrderById, type ProductionOrder } from '@/lib/supabase/production-queries'
import { NutritionalLabel } from './NutritionalLabel'

interface ProductionDetailModalProps {
  productionOrderId: string
  onClose: () => void
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'En Proceso', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

export function ProductionDetailModal({ productionOrderId, onClose }: ProductionDetailModalProps) {
  const [po, setPo] = useState<ProductionOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'recipe' | 'nutrition' | 'info'>('recipe')

  useEffect(() => {
    loadData()
  }, [productionOrderId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getProductionOrderById(productionOrderId)
      setPo(data)
    } catch (error) {
      console.error('Error loading production order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const hasIncompleteNutritionalData = po?.movements?.some(
    mov => mov.ingredient && (
      mov.ingredient.calories === 0 &&
      mov.ingredient.protein === 0 &&
      mov.ingredient.fat === 0 &&
      mov.ingredient.carbohydrates === 0
    )
  ) || false

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-bold text-dark">
              {po?.product_name || 'Cargando...'}
            </h2>
            {po && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded text-dark-light">
                  {po.sku}
                </span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  STATUS_LABELS[po.status]?.color || 'bg-gray-100'
                )}>
                  {STATUS_LABELS[po.status]?.label || po.status}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg text-dark-light">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : po ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-border">
              {[
                { id: 'recipe' as const, label: 'Receta' },
                { id: 'nutrition' as const, label: 'Nutrición' },
                { id: 'info' as const, label: 'Info' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                    activeTab === tab.id
                      ? 'text-primary border-primary'
                      : 'text-dark-light border-transparent hover:text-dark'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'recipe' && (
                <div>
                  {!po.movements || po.movements.length === 0 ? (
                    <div className="text-center py-8 text-dark-light">
                      <p>Sin receta asociada</p>
                      <p className="text-sm mt-1">Este producto no tiene ingredientes configurados.</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-2 font-medium text-dark-light">Ingrediente</th>
                          <th className="pb-2 font-medium text-dark-light text-right">Planificado</th>
                          {po.status === 'completed' && (
                            <>
                              <th className="pb-2 font-medium text-dark-light text-right">Real</th>
                              <th className="pb-2 font-medium text-dark-light text-right">Merma</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {po.movements.map(mov => (
                          <tr key={mov.id}>
                            <td className="py-2">
                              <span className="font-medium text-dark">
                                {mov.ingredient?.name || 'Ingrediente'}
                              </span>
                              <span className="text-dark-light ml-1">
                                ({mov.ingredient?.unit || ''})
                              </span>
                            </td>
                            <td className="py-2 text-right font-mono text-dark-light">
                              {mov.planned_quantity.toFixed(2)}
                            </td>
                            {po.status === 'completed' && (
                              <>
                                <td className="py-2 text-right font-mono text-dark">
                                  {mov.actual_quantity?.toFixed(2) ?? '-'}
                                </td>
                                <td className={cn(
                                  'py-2 text-right font-mono',
                                  mov.waste_quantity > 0 ? 'text-red-600' : 'text-dark-light'
                                )}>
                                  {mov.waste_quantity > 0 ? mov.waste_quantity.toFixed(2) : '-'}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'nutrition' && (
                <div className="flex flex-col items-center py-4">
                  {po.nutritional_info ? (
                    <NutritionalLabel
                      nutritionalInfo={po.nutritional_info}
                      hasIncompleteData={hasIncompleteNutritionalData}
                    />
                  ) : po.status === 'completed' ? (
                    <p className="text-dark-light text-center">
                      No se pudo calcular la información nutricional.
                    </p>
                  ) : (
                    <div className="text-center text-dark-light">
                      <p>La información nutricional se calcula al completar la producción.</p>
                      <p className="text-sm mt-1">Asegúrate de que los ingredientes tengan datos nutricionales cargados.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary rounded-lg p-4">
                      <p className="text-xs text-dark-light uppercase mb-1">SKU</p>
                      <p className="font-mono font-medium text-dark">{po.sku}</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-4">
                      <p className="text-xs text-dark-light uppercase mb-1">Cantidad</p>
                      <p className="font-medium text-dark">{po.quantity} unidad(es)</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-4">
                      <p className="text-xs text-dark-light uppercase mb-1">Tipo</p>
                      <p className="font-medium text-dark capitalize">{po.product_type}</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-4">
                      <p className="text-xs text-dark-light uppercase mb-1">Estado</p>
                      <span className={cn(
                        'text-sm px-2 py-0.5 rounded-full font-medium',
                        STATUS_LABELS[po.status]?.color
                      )}>
                        {STATUS_LABELS[po.status]?.label}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="bg-secondary rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-dark-light">Creado:</span>
                      <span className="text-sm text-dark">
                        {new Date(po.created_at).toLocaleString('es-CL')}
                      </span>
                    </div>
                    {po.started_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-dark-light">Iniciado:</span>
                        <span className="text-sm text-dark">
                          {new Date(po.started_at).toLocaleString('es-CL')}
                        </span>
                      </div>
                    )}
                    {po.completed_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-dark-light">Completado:</span>
                        <span className="text-sm text-dark">
                          {new Date(po.completed_at).toLocaleString('es-CL')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Linked order */}
                  {po.order && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-xs text-purple-600 uppercase mb-1">Pedido vinculado</p>
                      <p className="font-medium text-purple-800">{po.order.order_number}</p>
                      <p className="text-sm text-purple-600">Evento: {po.order.event_date}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {po.notes && (
                    <div className="bg-secondary rounded-lg p-4">
                      <p className="text-xs text-dark-light uppercase mb-1">Notas</p>
                      <p className="text-sm text-dark">{po.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-border bg-secondary">
              <button
                onClick={onClose}
                className="px-4 py-2 text-dark-light hover:bg-white rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-dark-light">
            Orden de producción no encontrada
          </div>
        )}
      </div>
    </div>
  )
}
