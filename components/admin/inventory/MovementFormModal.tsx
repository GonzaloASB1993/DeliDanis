'use client'

import { useState } from 'react'
import type { Ingredient } from '@/lib/supabase/inventory-queries'
import { cn } from '@/lib/utils/cn'

const MOVEMENT_TYPES = [
  { value: 'in', label: 'Entrada', description: 'Compra o reposición' },
  { value: 'out', label: 'Salida', description: 'Uso en producción' },
  { value: 'waste', label: 'Merma', description: 'Pérdida, vencimiento, daño' },
  { value: 'adjustment', label: 'Ajuste', description: 'Corrección de inventario' },
] as const

interface MovementFormModalProps {
  ingredients: Ingredient[]
  preselectedIngredientId?: string | null
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

export function MovementFormModal({
  ingredients,
  preselectedIngredientId,
  onClose,
  onSave,
}: MovementFormModalProps) {
  const [formData, setFormData] = useState({
    ingredient_id: preselectedIngredientId || '',
    movement_type: 'in' as 'in' | 'out' | 'adjustment' | 'waste',
    quantity: '',
    unit_cost: '',
    reference: '',
    notes: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedIngredient = ingredients.find(i => i.id === formData.ingredient_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const quantity = parseFloat(formData.quantity)
    if (!quantity || quantity <= 0) {
      setError('La cantidad debe ser mayor a 0')
      return
    }

    // Validate out/waste doesn't exceed stock
    if (
      (formData.movement_type === 'out' || formData.movement_type === 'waste') &&
      selectedIngredient &&
      quantity > selectedIngredient.current_stock
    ) {
      setError(`Stock insuficiente. Disponible: ${selectedIngredient.current_stock} ${selectedIngredient.unit}`)
      return
    }

    // Validate cost required for entries (needed for weighted average cost)
    let unitCost: number | null = formData.unit_cost ? parseFloat(formData.unit_cost) : null
    if (formData.movement_type === 'in' && (!unitCost || unitCost <= 0)) {
      setError('El costo unitario es obligatorio para entradas (se usa para calcular el costo promedio ponderado)')
      return
    }

    // Auto-set unit_cost for waste from ingredient's current weighted average cost
    if (formData.movement_type === 'waste' && selectedIngredient) {
      unitCost = selectedIngredient.unit_cost
    }

    setIsSaving(true)
    try {
      await onSave({
        ingredient_id: formData.ingredient_id,
        movement_type: formData.movement_type,
        quantity,
        unit_cost: unitCost,
        reference: formData.reference.trim() || null,
        notes: formData.notes.trim() || null,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-display font-bold text-dark">Nuevo Movimiento</h2>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg text-dark-light">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Insumo */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">Insumo *</label>
            <select
              required
              value={formData.ingredient_id}
              onChange={e => setFormData({ ...formData, ingredient_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Seleccionar insumo...</option>
              {ingredients.map(ing => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} (Stock: {ing.current_stock} {ing.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de movimiento */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">Tipo de movimiento *</label>
            <div className="grid grid-cols-2 gap-2">
              {MOVEMENT_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, movement_type: type.value })}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-colors',
                    formData.movement_type === type.value
                      ? type.value === 'in' ? 'border-green-500 bg-green-50 text-green-700'
                        : type.value === 'out' ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : type.value === 'waste' ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <span className="text-sm font-medium">{type.label}</span>
                  <span className="block text-xs opacity-70">{type.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cantidad y Costo */}
          <div className={cn('grid gap-4', formData.movement_type === 'waste' ? 'grid-cols-1' : 'grid-cols-2')}>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">
                {formData.movement_type === 'adjustment' ? 'Nuevo stock *' : 'Cantidad *'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  required
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary pr-16"
                  placeholder="0"
                />
                {selectedIngredient && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-dark-light">
                    {selectedIngredient.unit}
                  </span>
                )}
              </div>
              {formData.movement_type === 'waste' && selectedIngredient && formData.quantity && (
                <p className="text-xs text-dark-light mt-1">
                  Costo estimado de merma: <span className="font-medium text-red-600">
                    ${((parseFloat(formData.quantity) || 0) * selectedIngredient.unit_cost).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </span> (a ${selectedIngredient.unit_cost.toLocaleString('es-CO')}/{selectedIngredient.unit})
                </p>
              )}
            </div>
            {formData.movement_type !== 'waste' && (
              <div>
                <label className="block text-sm font-medium text-dark mb-1">
                  Costo unitario ($) {formData.movement_type === 'in' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required={formData.movement_type === 'in'}
                  value={formData.unit_cost}
                  onChange={e => setFormData({ ...formData, unit_cost: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="0"
                />
                {formData.movement_type === 'in' && (
                  <p className="text-xs text-dark-light mt-1">Se calcula costo promedio ponderado</p>
                )}
              </div>
            )}
          </div>

          {/* Referencia */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">Referencia</label>
            <input
              type="text"
              value={formData.reference}
              onChange={e => setFormData({ ...formData, reference: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder={
                formData.movement_type === 'in' ? 'Ej: Compra #123'
                  : formData.movement_type === 'out' ? 'Ej: Pedido #456'
                  : formData.movement_type === 'waste' ? 'Ej: Vencimiento, daño, derrame'
                  : 'Ej: Conteo físico'
              }
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">Notas</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              placeholder="Observaciones adicionales..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-light hover:bg-secondary rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.ingredient_id}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Registrando...' : 'Registrar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
