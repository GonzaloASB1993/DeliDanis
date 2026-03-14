'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  getRecipesByProduct,
  saveRecipe,
  type Ingredient,
  type RecipeItem,
} from '@/lib/supabase/inventory-queries'
import {
  getCakeProductsAdmin,
  getCocktailProductsAdmin,
  getPastryProductsAdmin,
} from '@/lib/supabase/catalog-mutations'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

type ProductType = 'cake' | 'cocktail' | 'pastry'

interface RecipeEditorProps {
  ingredients: Ingredient[]
}

interface RecipeRow {
  ingredient_id: string
  quantity_needed: string
  waste_percentage: string
}

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  cake: 'Tortas',
  cocktail: 'Coctelería',
  pastry: 'Pastelería',
}

export function RecipeEditor({ ingredients }: RecipeEditorProps) {
  const [productType, setProductType] = useState<ProductType>('cake')
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [rows, setRows] = useState<RecipeRow[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Load products when type changes
  useEffect(() => {
    const load = async () => {
      setIsLoadingProducts(true)
      setSelectedProductId('')
      setRows([])
      try {
        let prods: any[] = []
        if (productType === 'cake') prods = await getCakeProductsAdmin()
        else if (productType === 'cocktail') prods = await getCocktailProductsAdmin()
        else prods = await getPastryProductsAdmin()
        setProducts(prods || [])
      } catch {
        setProducts([])
      } finally {
        setIsLoadingProducts(false)
      }
    }
    load()
  }, [productType])

  // Load recipe when product changes
  useEffect(() => {
    if (!selectedProductId) {
      setRows([])
      return
    }
    const load = async () => {
      setIsLoadingRecipe(true)
      try {
        const items = await getRecipesByProduct(selectedProductId, productType)
        if (items.length > 0) {
          setRows(items.map(item => ({
            ingredient_id: item.ingredient_id,
            quantity_needed: item.quantity_needed.toString(),
            waste_percentage: item.waste_percentage.toString(),
          })))
        } else {
          setRows([])
        }
      } catch {
        setRows([])
      } finally {
        setIsLoadingRecipe(false)
      }
    }
    load()
  }, [selectedProductId, productType])

  const addRow = () => {
    setRows([...rows, { ingredient_id: '', quantity_needed: '', waste_percentage: '0' }])
  }

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, field: keyof RecipeRow, value: string) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: value }
    setRows(newRows)
  }

  // Calculate total cost including waste
  const totalCost = useMemo(() => {
    return rows.reduce((sum, row) => {
      const ing = ingredients.find(i => i.id === row.ingredient_id)
      if (!ing) return sum
      const qty = parseFloat(row.quantity_needed) || 0
      const wasteFactor = 1 + ((parseFloat(row.waste_percentage) || 0) / 100)
      return sum + (qty * ing.unit_cost * wasteFactor)
    }, 0)
  }, [rows, ingredients])

  const totalCostWithoutWaste = useMemo(() => {
    return rows.reduce((sum, row) => {
      const ing = ingredients.find(i => i.id === row.ingredient_id)
      if (!ing) return sum
      const qty = parseFloat(row.quantity_needed) || 0
      return sum + (qty * ing.unit_cost)
    }, 0)
  }, [rows, ingredients])

  const handleSave = async () => {
    if (!selectedProductId) return

    const validRows = rows.filter(r => r.ingredient_id && parseFloat(r.quantity_needed) > 0)

    setIsSaving(true)
    setSaveMessage('')
    try {
      const success = await saveRecipe(
        selectedProductId,
        productType,
        validRows.map(r => ({
          ingredient_id: r.ingredient_id,
          quantity_needed: parseFloat(r.quantity_needed),
          waste_percentage: parseFloat(r.waste_percentage) || 0,
        }))
      )
      setSaveMessage(success ? 'Receta guardada correctamente' : 'Error al guardar')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // Ingredients not yet used in this recipe
  const availableIngredients = (currentId: string) => {
    const usedIds = rows.map(r => r.ingredient_id).filter(id => id !== currentId)
    return ingredients.filter(i => !usedIds.includes(i.id))
  }

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Product type */}
          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-dark mb-1">Tipo de producto</label>
            <div className="flex gap-2">
              {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setProductType(type)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    productType === type
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-dark-light hover:bg-gray-200'
                  )}
                >
                  {PRODUCT_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Product selector */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-dark mb-1">Producto</label>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              disabled={isLoadingProducts}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">
                {isLoadingProducts ? 'Cargando...' : 'Seleccionar producto...'}
              </option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Recipe table */}
      {selectedProductId && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoadingRecipe ? (
            <div className="p-8 text-center text-dark-light">Cargando receta...</div>
          ) : (
            <>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-dark">
                  Ingredientes de la receta
                </h3>
                <button
                  onClick={addRow}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-hover transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar
                </button>
              </div>

              {rows.length === 0 ? (
                <div className="p-8 text-center text-dark-light">
                  <p>Esta receta no tiene ingredientes.</p>
                  <button
                    onClick={addRow}
                    className="mt-2 text-primary hover:text-primary-hover text-sm font-medium"
                  >
                    Agregar primer ingrediente
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary text-sm text-dark-light">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Ingrediente</th>
                        <th className="text-left px-4 py-3 font-medium">Cantidad</th>
                        <th className="text-left px-4 py-3 font-medium">Unidad</th>
                        <th className="text-left px-4 py-3 font-medium">Merma %</th>
                        <th className="text-right px-4 py-3 font-medium">Costo</th>
                        <th className="text-right px-4 py-3 font-medium">Costo c/merma</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((row, index) => {
                        const ing = ingredients.find(i => i.id === row.ingredient_id)
                        const qty = parseFloat(row.quantity_needed) || 0
                        const wasteFactor = 1 + ((parseFloat(row.waste_percentage) || 0) / 100)
                        const baseCost = qty * (ing?.unit_cost || 0)
                        const costWithWaste = baseCost * wasteFactor

                        return (
                          <tr key={index} className="hover:bg-secondary/30">
                            <td className="px-4 py-2">
                              <select
                                value={row.ingredient_id}
                                onChange={e => updateRow(index, 'ingredient_id', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30"
                              >
                                <option value="">Seleccionar...</option>
                                {availableIngredients(row.ingredient_id).map(i => (
                                  <option key={i.id} value={i.id}>{i.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={row.quantity_needed}
                                onChange={e => updateRow(index, 'quantity_needed', e.target.value)}
                                className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-4 py-2 text-sm text-dark-light">
                              {ing?.unit || '-'}
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={row.waste_percentage}
                                onChange={e => updateRow(index, 'waste_percentage', e.target.value)}
                                className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-4 py-2 text-right text-sm text-dark-light">
                              {formatCurrency(baseCost)}
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-medium text-dark">
                              {formatCurrency(costWithWaste)}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => removeRow(index)}
                                className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals and save */}
              {rows.length > 0 && (
                <div className="p-4 border-t border-border bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-dark-light">
                        Costo base: <span className="font-medium text-dark">{formatCurrency(totalCostWithoutWaste)}</span>
                      </p>
                      <p className="text-sm text-dark-light">
                        Costo con merma: <span className="font-bold text-dark text-base">{formatCurrency(totalCost)}</span>
                      </p>
                      {totalCost > totalCostWithoutWaste && (
                        <p className="text-xs text-red-500">
                          +{formatCurrency(totalCost - totalCostWithoutWaste)} por merma estimada
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {saveMessage && (
                        <span className={cn(
                          'text-sm',
                          saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'
                        )}>
                          {saveMessage}
                        </span>
                      )}
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                      >
                        {isSaving ? 'Guardando...' : 'Guardar Receta'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!selectedProductId && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-dark-light">
          <svg className="w-12 h-12 mx-auto mb-3 text-dark-light/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>Selecciona un tipo de producto y un producto para editar su receta.</p>
        </div>
      )}
    </div>
  )
}
