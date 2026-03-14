'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  createCakeProduct,
  updateCakeProduct,
  createCocktailProduct,
  updateCocktailProduct,
  createPastryProduct,
  updatePastryProduct,
  uploadProductImage,
  addProductImage,
  deleteProductImage,
  setImageAsPrimary,
  getProductImages,
  createCategory,
  createSubcategory,
  type ProductType
} from '@/lib/supabase/catalog-mutations'
import { cn } from '@/lib/utils/cn'

interface ProductFormModalProps {
  productType: ProductType
  product: any | null
  categories: any[]
  subcategories: any[]
  onClose: () => void
  onSave: () => void
}

export function ProductFormModal({
  productType,
  product,
  categories: initialCategories,
  subcategories: initialSubcategories,
  onClose,
  onSave,
}: ProductFormModalProps) {
  const isEditing = !!product

  // Local copies of categories and subcategories (to update when creating new ones)
  const [categories, setCategories] = useState(initialCategories)
  const [subcategories, setSubcategories] = useState(initialSubcategories)

  // Common fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)

  // Cake specific
  const [basePrice, setBasePrice] = useState('')
  const [minPortions, setMinPortions] = useState('15')
  const [maxPortions, setMaxPortions] = useState('80')
  const [pricePerPortion, setPricePerPortion] = useState('')
  const [preparationDays, setPreparationDays] = useState('3')
  const [isCustomizable, setIsCustomizable] = useState(true)

  // Cocktail/Pastry specific
  const [price, setPrice] = useState('')
  const [minOrderQuantity, setMinOrderQuantity] = useState('15')
  const [unit, setUnit] = useState('unidad')

  // Images
  const [images, setImages] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [error, setError] = useState('')

  // New category/subcategory creation states
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [showNewSubcategoryInput, setShowNewSubcategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false)

  // Cargar datos si es edición
  useEffect(() => {
    if (product) {
      setName(product.name || '')
      setDescription(product.description || '')
      setCategoryId(product.category_id || '')
      setSubcategoryId(product.subcategory_id || '')
      setIsActive(product.is_active ?? true)
      setIsFeatured(product.is_featured ?? false)

      if (productType === 'cake') {
        setBasePrice(product.base_price?.toString() || '')
        setMinPortions(product.min_portions?.toString() || '15')
        setMaxPortions(product.max_portions?.toString() || '80')
        setPricePerPortion(product.price_per_portion?.toString() || '')
        setPreparationDays(product.preparation_days?.toString() || '3')
        setIsCustomizable(product.is_customizable ?? true)
      } else {
        setPrice(product.price?.toString() || '')
        setMinOrderQuantity(product.min_order_quantity?.toString() || '15')
        if (productType === 'pastry') {
          setUnit(product.unit || 'unidad')
        }
      }

      // Cargar imágenes
      if (product.images) {
        setImages(product.images)
      }
    }
  }, [product, productType])

  // Subcategorías filtradas
  const filteredSubcategories = subcategories.filter(s => s.category_id === categoryId)

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Crear nueva categoría
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    setIsCreatingCategory(true)
    try {
      const newCategory = await createCategory(productType, {
        name: newCategoryName.trim(),
        slug: generateSlug(newCategoryName),
        is_active: true,
      })

      if (newCategory) {
        setCategories(prev => [...prev, newCategory])
        setCategoryId(newCategory.id)
        setNewCategoryName('')
        setShowNewCategoryInput(false)
      }
    } catch (err: any) {
      console.error('Error creating category:', err)
      setError(err.message || 'Error al crear la categoría')
    } finally {
      setIsCreatingCategory(false)
    }
  }

  // Crear nueva subcategoría
  const handleCreateSubcategory = async () => {
    if (!newSubcategoryName.trim()) return

    // Para cocktail, la subcategoría puede no tener category_id
    // Para otros tipos, requiere una categoría seleccionada
    if (productType !== 'cocktail' && !categoryId) {
      setError('Primero selecciona una categoría')
      return
    }

    setIsCreatingSubcategory(true)
    try {
      const newSubcategory = await createSubcategory(productType, {
        category_id: categoryId,
        name: newSubcategoryName.trim(),
        slug: generateSlug(newSubcategoryName),
        is_active: true,
      })

      if (newSubcategory) {
        setSubcategories(prev => [...prev, newSubcategory])
        setSubcategoryId(newSubcategory.id)
        setNewSubcategoryName('')
        setShowNewSubcategoryInput(false)
      }
    } catch (err: any) {
      console.error('Error creating subcategory:', err)
      setError(err.message || 'Error al crear la subcategoría')
    } finally {
      setIsCreatingSubcategory(false)
    }
  }

  const handleGenerateDescription = async () => {
    if (!name.trim()) {
      setError('Ingresa un nombre primero para generar la descripción')
      return
    }

    setIsGeneratingAI(true)
    setError('')

    try {
      const categoryName = categories.find(c => c.id === categoryId)?.name || ''

      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: name,
          productType,
          category: categoryName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar descripción')
      }

      setDescription(data.description)
    } catch (error: any) {
      console.error('Error generating description:', error)
      setError(error.message || 'Error al generar descripción con AI')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !product?.id) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const url = await uploadProductImage(file, productType, product.id)
        const newImage = await addProductImage({
          product_type: productType,
          product_id: product.id,
          url,
          alt_text: name,
          is_primary: images.length === 0,
          order_index: images.length,
        })
        setImages(prev => [...prev, newImage])
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (imageId: string, url: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return

    try {
      await deleteProductImage(imageId, url)
      setImages(prev => prev.filter(img => img.id !== imageId))
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    if (!product?.id) return

    try {
      await setImageAsPrimary(imageId, productType, product.id)
      setImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })))
    } catch (error) {
      console.error('Error setting primary:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }

    setIsLoading(true)
    try {
      if (productType === 'cake') {
        if (!categoryId) {
          setError('Selecciona una categoría')
          setIsLoading(false)
          return
        }

        const data = {
          category_id: categoryId,
          subcategory_id: subcategoryId || undefined,
          name: name.trim(),
          slug: generateSlug(name),
          description: description.trim() || undefined,
          base_price: parseFloat(basePrice) || 0,
          min_portions: parseInt(minPortions) || 15,
          max_portions: parseInt(maxPortions) || 80,
          price_per_portion: parseFloat(pricePerPortion) || undefined,
          preparation_days: parseInt(preparationDays) || 3,
          is_customizable: isCustomizable,
          is_active: isActive,
          is_featured: isFeatured,
        }

        if (isEditing) {
          await updateCakeProduct(product.id, data)
        } else {
          await createCakeProduct(data)
        }
      } else if (productType === 'cocktail') {
        if (!subcategoryId) {
          setError('Selecciona una subcategoría')
          setIsLoading(false)
          return
        }

        const data = {
          subcategory_id: subcategoryId,
          name: name.trim(),
          slug: generateSlug(name),
          description: description.trim() || undefined,
          price: parseFloat(price) || 0,
          min_order_quantity: parseInt(minOrderQuantity) || 15,
          is_active: isActive,
          is_featured: isFeatured,
        }

        if (isEditing) {
          await updateCocktailProduct(product.id, data)
        } else {
          await createCocktailProduct(data)
        }
      } else {
        // Pastry
        if (!categoryId) {
          setError('Selecciona una categoría')
          setIsLoading(false)
          return
        }

        const data = {
          category_id: categoryId,
          subcategory_id: subcategoryId || undefined,
          name: name.trim(),
          slug: generateSlug(name),
          description: description.trim() || undefined,
          price: parseFloat(price) || 0,
          unit,
          min_order_quantity: parseInt(minOrderQuantity) || 1,
          is_active: isActive,
          is_featured: isFeatured,
        }

        if (isEditing) {
          await updatePastryProduct(product.id, data)
        } else {
          await createPastryProduct(data)
        }
      }

      onSave()
    } catch (error: any) {
      console.error('Error saving product:', error)
      setError(error.message || 'Error al guardar el producto')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-dark">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Nombre y Descripción */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="Nombre del producto"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-dark">
                      Descripción
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={isGeneratingAI || !name.trim()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingAI ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generando...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generar con AI
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                    placeholder="Descripción del producto"
                  />
                </div>
              </div>

              {/* Categorías */}
              <div className="grid grid-cols-2 gap-4">
                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-1">
                    Categoría {productType !== 'cocktail' && <span className="text-red-500">*</span>}
                  </label>
                  {showNewCategoryInput ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nombre de la categoría"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleCreateCategory()
                          } else if (e.key === 'Escape') {
                            setShowNewCategoryInput(false)
                            setNewCategoryName('')
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={isCreatingCategory || !newCategoryName.trim()}
                        className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 text-sm"
                      >
                        {isCreatingCategory ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCategoryInput(false)
                          setNewCategoryName('')
                        }}
                        className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={categoryId}
                        onChange={(e) => {
                          setCategoryId(e.target.value)
                          setSubcategoryId('')
                        }}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      >
                        <option value="">Seleccionar...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryInput(true)}
                        className="px-3 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
                        title="Nueva categoría"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Subcategoría */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-1">
                    Subcategoría {productType === 'cocktail' && <span className="text-red-500">*</span>}
                  </label>
                  {showNewSubcategoryInput ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        placeholder="Nombre de la subcategoría"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleCreateSubcategory()
                          } else if (e.key === 'Escape') {
                            setShowNewSubcategoryInput(false)
                            setNewSubcategoryName('')
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleCreateSubcategory}
                        disabled={isCreatingSubcategory || !newSubcategoryName.trim()}
                        className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 text-sm"
                      >
                        {isCreatingSubcategory ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewSubcategoryInput(false)
                          setNewSubcategoryName('')
                        }}
                        className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={subcategoryId}
                        onChange={(e) => setSubcategoryId(e.target.value)}
                        disabled={productType !== 'cocktail' && !categoryId}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-50"
                      >
                        <option value="">{productType === 'cocktail' ? 'Seleccionar...' : 'Ninguna'}</option>
                        {(productType === 'cocktail' && !categoryId ? subcategories : filteredSubcategories).map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowNewSubcategoryInput(true)}
                        disabled={productType !== 'cocktail' && !categoryId}
                        className="px-3 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Nueva subcategoría"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {productType !== 'cocktail' && !categoryId && !showNewSubcategoryInput && (
                    <p className="text-xs text-gray-500 mt-1">Selecciona una categoría primero</p>
                  )}
                </div>
              </div>

              {/* Campos específicos por tipo */}
              {productType === 'cake' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1">
                        Precio Base <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={basePrice}
                          onChange={(e) => setBasePrice(e.target.value)}
                          className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1">
                        Precio por Porción
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={pricePerPortion}
                          onChange={(e) => setPricePerPortion(e.target.value)}
                          className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1">
                        Mín. Porciones
                      </label>
                      <input
                        type="number"
                        value={minPortions}
                        onChange={(e) => setMinPortions(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1">
                        Máx. Porciones
                      </label>
                      <input
                        type="number"
                        value={maxPortions}
                        onChange={(e) => setMaxPortions(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1">
                        Días Preparación
                      </label>
                      <input
                        type="number"
                        value={preparationDays}
                        onChange={(e) => setPreparationDays(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCustomizable}
                      onChange={(e) => setIsCustomizable(e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-dark">Personalizable</span>
                  </label>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1">
                        Precio <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1">
                        Cantidad Mínima
                      </label>
                      <input
                        type="number"
                        value={minOrderQuantity}
                        onChange={(e) => setMinOrderQuantity(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                  </div>

                  {productType === 'pastry' && (
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1">
                        Unidad
                      </label>
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      >
                        <option value="unidad">Unidad</option>
                        <option value="docena">Docena</option>
                        <option value="paquete de 6">Paquete de 6</option>
                        <option value="paquete de 12">Paquete de 12</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Estado y Destacado */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-dark">Producto activo</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-dark">Destacado</span>
                </label>
              </div>

              {/* Imágenes (solo en edición) */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    Imágenes
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className={cn(
                          'relative w-24 h-24 rounded-lg overflow-hidden border-2',
                          image.is_primary ? 'border-primary' : 'border-transparent'
                        )}
                      >
                        <Image
                          src={image.url}
                          alt={image.alt_text || name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors group">
                          <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!image.is_primary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimary(image.id)}
                                className="p-1.5 bg-white rounded-lg text-gray-600 hover:text-primary"
                                title="Establecer como principal"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(image.id, image.url)}
                              className="p-1.5 bg-white rounded-lg text-gray-600 hover:text-red-600"
                              title="Eliminar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {image.is_primary && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-white text-xs rounded">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Botón subir */}
                    <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                      {uploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                      ) : (
                        <>
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-xs text-gray-500 mt-1">Subir</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Primero guarda el producto para poder subir imágenes.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
