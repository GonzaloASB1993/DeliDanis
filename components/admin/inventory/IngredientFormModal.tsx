'use client'

import { useState } from 'react'
import type { Ingredient } from '@/lib/supabase/inventory-queries'

const UNIT_OPTIONS = ['kg', 'gr', 'lt', 'ml', 'unidad']

const CATEGORY_SUGGESTIONS = [
  'Harina',
  'Azúcar',
  'Lácteo',
  'Fruta',
  'Huevo',
  'Chocolate',
  'Decoración',
  'Empaque',
  'Bebida',
  'Especia',
  'Grasa',
  'Otro',
]

interface IngredientFormModalProps {
  ingredient?: Ingredient | null
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

export function IngredientFormModal({ ingredient, onClose, onSave }: IngredientFormModalProps) {
  const isEditing = !!ingredient

  const [formData, setFormData] = useState({
    name: ingredient?.name || '',
    category: ingredient?.category || '',
    unit: ingredient?.unit || 'kg',
    min_stock: ingredient?.min_stock?.toString() || '0',
    unit_cost: ingredient?.unit_cost?.toString() || '0',
    supplier: ingredient?.supplier || '',
    initial_stock: '',
    calories: ingredient?.calories?.toString() || '0',
    protein: ingredient?.protein?.toString() || '0',
    fat: ingredient?.fat?.toString() || '0',
    saturated_fat: ingredient?.saturated_fat?.toString() || '0',
    carbohydrates: ingredient?.carbohydrates?.toString() || '0',
    sugar: ingredient?.sugar?.toString() || '0',
    fiber: ingredient?.fiber?.toString() || '0',
    sodium: ingredient?.sodium?.toString() || '0',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSaving(true)
    try {
      await onSave({
        name: formData.name.trim(),
        category: formData.category.trim() || null,
        unit: formData.unit,
        min_stock: parseFloat(formData.min_stock) || 0,
        unit_cost: parseFloat(formData.unit_cost) || 0,
        supplier: formData.supplier.trim() || null,
        calories: parseFloat(formData.calories) || 0,
        protein: parseFloat(formData.protein) || 0,
        fat: parseFloat(formData.fat) || 0,
        saturated_fat: parseFloat(formData.saturated_fat) || 0,
        carbohydrates: parseFloat(formData.carbohydrates) || 0,
        sugar: parseFloat(formData.sugar) || 0,
        fiber: parseFloat(formData.fiber) || 0,
        sodium: parseFloat(formData.sodium) || 0,
        ...(isEditing ? {} : { initial_stock: parseFloat(formData.initial_stock) || 0 }),
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
          <h2 className="text-lg font-display font-bold text-dark">
            {isEditing ? 'Editar Insumo' : 'Nuevo Insumo'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg text-dark-light">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Ej: Harina de trigo"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">Categoría</label>
            <input
              type="text"
              list="category-suggestions"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Ej: Harina"
            />
            <datalist id="category-suggestions">
              {CATEGORY_SUGGESTIONS.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          {/* Unidad y Costo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Unidad *</label>
              <select
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {UNIT_OPTIONS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Costo unitario ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_cost}
                onChange={e => setFormData({ ...formData, unit_cost: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Stock mínimo y Stock inicial */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Stock mínimo</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.min_stock}
                onChange={e => setFormData({ ...formData, min_stock: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Stock inicial</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.initial_stock}
                  onChange={e => setFormData({ ...formData, initial_stock: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">Proveedor</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={e => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Ej: Distribuidora Norte"
            />
          </div>

          {/* Información Nutricional */}
          <details className="border border-border rounded-lg">
            <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-dark hover:bg-secondary/50 rounded-lg select-none">
              Información Nutricional (por 100g/ml)
            </summary>
            <div className="px-4 pb-4 pt-2 grid grid-cols-2 gap-3">
              {[
                { key: 'calories', label: 'Calorías (kcal)' },
                { key: 'protein', label: 'Proteínas (g)' },
                { key: 'fat', label: 'Grasas totales (g)' },
                { key: 'saturated_fat', label: 'Grasas saturadas (g)' },
                { key: 'carbohydrates', label: 'Carbohidratos (g)' },
                { key: 'sugar', label: 'Azúcares (g)' },
                { key: 'fiber', label: 'Fibra (g)' },
                { key: 'sodium', label: 'Sodio (mg)' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-dark-light mb-1">{field.label}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={(formData as any)[field.key]}
                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              ))}
            </div>
          </details>

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
              disabled={isSaving || !formData.name.trim()}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Insumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
