'use client'

import { useState } from 'react'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  type ProductType
} from '@/lib/supabase/catalog-mutations'
import { cn } from '@/lib/utils/cn'

interface CategoryManagerProps {
  productType: ProductType
  categories: any[]
  subcategories: any[]
  onUpdate: () => void
}

export function CategoryManager({
  productType,
  categories,
  subcategories,
  onUpdate,
}: CategoryManagerProps) {
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Form states
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [subcategoryName, setSubcategoryName] = useState('')
  const [subcategoryDescription, setSubcategoryDescription] = useState('')

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleEditCategory = (category: any) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setCategoryDescription(category.description || '')
    setShowCategoryForm(true)
  }

  const handleEditSubcategory = (subcategory: any) => {
    setEditingSubcategory(subcategory)
    setSubcategoryName(subcategory.name)
    setSubcategoryDescription(subcategory.description || '')
    setSelectedCategoryId(subcategory.category_id)
    setShowSubcategoryForm(true)
  }

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return

    setIsLoading(true)
    try {
      if (editingCategory) {
        await updateCategory(productType, editingCategory.id, {
          name: categoryName,
          slug: generateSlug(categoryName),
          description: categoryDescription || undefined,
        })
      } else {
        await createCategory(productType, {
          name: categoryName,
          slug: generateSlug(categoryName),
          description: categoryDescription || undefined,
          is_active: true,
          order_index: categories.length,
        })
      }
      resetCategoryForm()
      onUpdate()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Error al guardar la categoría')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    const hasSubcategories = subcategories.some(s => s.category_id === id)
    if (hasSubcategories) {
      alert('No se puede eliminar una categoría que tiene subcategorías. Elimina primero las subcategorías.')
      return
    }

    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return

    setIsLoading(true)
    try {
      await deleteCategory(productType, id)
      onUpdate()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error al eliminar la categoría. Puede que tenga productos asociados.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSubcategory = async () => {
    if (!subcategoryName.trim() || !selectedCategoryId) return

    setIsLoading(true)
    try {
      if (editingSubcategory) {
        await updateSubcategory(productType, editingSubcategory.id, {
          category_id: selectedCategoryId,
          name: subcategoryName,
          slug: generateSlug(subcategoryName),
          description: subcategoryDescription || undefined,
        })
      } else {
        await createSubcategory(productType, {
          category_id: selectedCategoryId,
          name: subcategoryName,
          slug: generateSlug(subcategoryName),
          description: subcategoryDescription || undefined,
          is_active: true,
          order_index: subcategories.filter(s => s.category_id === selectedCategoryId).length,
        })
      }
      resetSubcategoryForm()
      onUpdate()
    } catch (error) {
      console.error('Error saving subcategory:', error)
      alert('Error al guardar la subcategoría')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta subcategoría?')) return

    setIsLoading(true)
    try {
      await deleteSubcategory(productType, id)
      onUpdate()
    } catch (error) {
      console.error('Error deleting subcategory:', error)
      alert('Error al eliminar la subcategoría. Puede que tenga productos asociados.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetCategoryForm = () => {
    setShowCategoryForm(false)
    setEditingCategory(null)
    setCategoryName('')
    setCategoryDescription('')
  }

  const resetSubcategoryForm = () => {
    setShowSubcategoryForm(false)
    setEditingSubcategory(null)
    setSubcategoryName('')
    setSubcategoryDescription('')
    setSelectedCategoryId('')
  }

  return (
    <div className="space-y-6">
      {/* Categorías */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-dark">Categorías</h3>
          <button
            onClick={() => setShowCategoryForm(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Categoría
          </button>
        </div>

        {/* Form de categoría */}
        {showCategoryForm && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Nombre de la categoría"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Descripción (opcional)"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveCategory}
                  disabled={isLoading || !categoryName.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Guardando...' : editingCategory ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  onClick={resetCategoryForm}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de categorías */}
        <div className="divide-y divide-gray-100">
          {categories.length === 0 ? (
            <div className="px-6 py-8 text-center text-dark-light">
              No hay categorías. Crea la primera.
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-dark">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-dark-light">{category.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {subcategories.filter(s => s.category_id === category.id).length} subcategorías
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'px-2 py-0.5 text-xs rounded-full',
                    category.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  )}>
                    {category.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Subcategorías */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-dark">Subcategorías</h3>
          <button
            onClick={() => setShowSubcategoryForm(true)}
            disabled={categories.length === 0}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Subcategoría
          </button>
        </div>

        {/* Form de subcategoría */}
        {showSubcategoryForm && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:w-48">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="">Categoría padre</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Nombre de la subcategoría"
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Descripción (opcional)"
                  value={subcategoryDescription}
                  onChange={(e) => setSubcategoryDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSubcategory}
                  disabled={isLoading || !subcategoryName.trim() || !selectedCategoryId}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Guardando...' : editingSubcategory ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  onClick={resetSubcategoryForm}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de subcategorías agrupadas por categoría */}
        <div className="divide-y divide-gray-100">
          {categories.length === 0 ? (
            <div className="px-6 py-8 text-center text-dark-light">
              Primero crea una categoría.
            </div>
          ) : subcategories.length === 0 ? (
            <div className="px-6 py-8 text-center text-dark-light">
              No hay subcategorías. Crea la primera.
            </div>
          ) : (
            categories.map((category) => {
              const catSubcategories = subcategories.filter(s => s.category_id === category.id)
              if (catSubcategories.length === 0) return null

              return (
                <div key={category.id}>
                  <div className="px-6 py-2 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase">{category.name}</p>
                  </div>
                  {catSubcategories.map((subcategory) => (
                    <div
                      key={subcategory.id}
                      className="px-6 py-3 pl-10 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-dark">{subcategory.name}</p>
                        {subcategory.description && (
                          <p className="text-sm text-dark-light">{subcategory.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'px-2 py-0.5 text-xs rounded-full',
                          subcategory.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        )}>
                          {subcategory.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                        <button
                          onClick={() => handleEditSubcategory(subcategory)}
                          className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSubcategory(subcategory.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
