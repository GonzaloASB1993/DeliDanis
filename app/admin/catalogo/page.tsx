'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  getCategories,
  getSubcategories,
  getCakeProductsAdmin,
  getCocktailProductsAdmin,
  getPastryProductsAdmin,
  toggleProductActive,
  toggleProductFeatured,
  deleteCakeProduct,
  deleteCocktailProduct,
  deletePastryProduct,
  type ProductType
} from '@/lib/supabase/catalog-mutations'
import { ProductTable } from '@/components/admin/catalog/ProductTable'
import { CategoryManager } from '@/components/admin/catalog/CategoryManager'
import { ProductFormModal } from '@/components/admin/catalog/ProductFormModal'
import { BulkUploadModal } from '@/components/admin/catalog/BulkUploadModal'
import { cn } from '@/lib/utils/cn'

const TABS: { id: ProductType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'cake',
    label: 'Tortas',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A1.75 1.75 0 003 15.546V17a2 2 0 002 2h14a2 2 0 002-2v-1.454zM3 11l1.5-1.5L6 11l1.5-1.5L9 11l1.5-1.5L12 11l1.5-1.5L15 11l1.5-1.5L18 11l1.5-1.5L21 11v3H3v-3z" />
      </svg>
    ),
  },
  {
    id: 'cocktail',
    label: 'Coctelería',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'pastry',
    label: 'Pastelería',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
]

function CatalogoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as ProductType) || 'cake'

  const [activeTab, setActiveTab] = useState<ProductType>(initialTab)
  const [view, setView] = useState<'products' | 'categories'>('products')
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Cargar datos cuando cambia el tab
  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Cargar categorías y subcategorías
      const [cats, subcats] = await Promise.all([
        getCategories(activeTab),
        getSubcategories(activeTab),
      ])
      setCategories(cats || [])
      setSubcategories(subcats || [])

      // Cargar productos
      let prods: any[] = []
      if (activeTab === 'cake') {
        prods = await getCakeProductsAdmin()
      } else if (activeTab === 'cocktail') {
        prods = await getCocktailProductsAdmin()
      } else {
        prods = await getPastryProductsAdmin()
      }
      setProducts(prods || [])
    } catch (error) {
      console.error('Error loading catalog data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (tab: ProductType) => {
    setActiveTab(tab)
    setFilterCategory('')
    setSearchTerm('')
    router.push(`/admin/catalogo?tab=${tab}`, { scroll: false })
  }

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    try {
      await toggleProductActive(activeTab, id, !currentValue)
      setProducts(products.map(p =>
        p.id === id ? { ...p, is_active: !currentValue } : p
      ))
    } catch (error) {
      console.error('Error toggling active:', error)
    }
  }

  const handleToggleFeatured = async (id: string, currentValue: boolean) => {
    try {
      await toggleProductFeatured(activeTab, id, !currentValue)
      setProducts(products.map(p =>
        p.id === id ? { ...p, is_featured: !currentValue } : p
      ))
    } catch (error) {
      console.error('Error toggling featured:', error)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return

    try {
      if (activeTab === 'cake') {
        await deleteCakeProduct(id)
      } else if (activeTab === 'cocktail') {
        await deleteCocktailProduct(id)
      } else {
        await deletePastryProduct(id)
      }
      setProducts(products.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
    setShowProductModal(true)
  }

  const handleNewProduct = () => {
    setEditingProduct(null)
    setShowProductModal(true)
  }

  const handleProductSaved = () => {
    setShowProductModal(false)
    setEditingProduct(null)
    loadData()
  }

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory ||
      product.category_id === filterCategory ||
      product.subcategory_id === filterCategory ||
      product.subcategory?.category_id === filterCategory
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && product.is_active) ||
      (filterStatus === 'inactive' && !product.is_active)

    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark">Catálogo</h1>
          <p className="text-dark-light mt-1">Administra productos, categorías y subcategorías</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Carga Masiva
          </button>
          <button
            onClick={handleNewProduct}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Tabs de tipo de producto */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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

        {/* Sub-tabs: Productos / Categorías */}
        <div className="flex gap-4 p-4 border-b border-gray-100">
          <button
            onClick={() => setView('products')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              view === 'products'
                ? 'bg-primary/10 text-primary'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            Productos ({products.length})
          </button>
          <button
            onClick={() => setView('categories')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              view === 'categories'
                ? 'bg-primary/10 text-primary'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            Categorías ({categories.length})
          </button>
        </div>
      </div>

      {/* Contenido */}
      {view === 'products' ? (
        <>
          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              {/* Filtro por categoría */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* Filtro por estado */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>

          {/* Tabla de productos */}
          <ProductTable
            products={filteredProducts}
            productType={activeTab}
            isLoading={isLoading}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onToggleActive={handleToggleActive}
            onToggleFeatured={handleToggleFeatured}
          />
        </>
      ) : (
        <CategoryManager
          productType={activeTab}
          categories={categories}
          subcategories={subcategories}
          onUpdate={loadData}
        />
      )}

      {/* Modal de producto */}
      {showProductModal && (
        <ProductFormModal
          productType={activeTab}
          product={editingProduct}
          categories={categories}
          subcategories={subcategories}
          onClose={() => {
            setShowProductModal(false)
            setEditingProduct(null)
          }}
          onSave={handleProductSaved}
        />
      )}

      {/* Modal de carga masiva */}
      {showBulkUploadModal && (
        <BulkUploadModal
          productType={activeTab}
          categories={categories}
          subcategories={subcategories}
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={() => {
            setShowBulkUploadModal(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}

export default function CatalogoAdminPage() {
  return (
    <Suspense fallback={
      <div className="p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="bg-white rounded-xl shadow-sm h-96"></div>
        </div>
      </div>
    }>
      <CatalogoContent />
    </Suspense>
  )
}
