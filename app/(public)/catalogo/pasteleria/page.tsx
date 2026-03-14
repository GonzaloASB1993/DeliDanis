'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils/format'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { getPastryProducts } from '@/lib/supabase/product-queries'
import { ProductDetailModal } from '@/components/public/ProductDetailModal'

interface ProductImage {
  id: string
  url: string
  alt_text?: string
  is_primary: boolean
}

interface PastryItem {
  id: string
  name: string
  slug: string
  description: string
  price: number
  unit: string
  is_featured: boolean
  min_order_quantity?: number
  category?: {
    id: string
    name: string
    slug: string
  }
  subcategory?: {
    id: string
    name: string
  }
  images?: ProductImage[]
}

const categories = [
  { id: 'todos', name: 'Todos', icon: '🍰' },
  { id: 'pies', name: 'Pies', icon: '🥧' },
  { id: 'tartas', name: 'Tartas', icon: '🍮' },
  { id: 'galletas', name: 'Galletas', icon: '🍪' },
  { id: 'bocaditos', name: 'Bocaditos', icon: '🥐' },
]

export default function PasteleriaPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('name')
  const [selectedProduct, setSelectedProduct] = useState<PastryItem | null>(null)

  // Estado para productos cargados desde BD
  const [products, setProducts] = useState<PastryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar productos desde la base de datos
  useEffect(() => {
    async function loadProducts() {
      try {
        setIsLoading(true)
        const { success, products: pastryProducts } = await getPastryProducts()

        if (success) {
          setProducts(pastryProducts as PastryItem[])
        } else {
          setError('No se pudieron cargar los productos')
        }
      } catch (err) {
        console.error('Error loading pastry products:', err)
        setError('Error al cargar los productos')
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        if (selectedCategory === 'todos') return true
        const categorySlug = item.category?.slug || ''
        return categorySlug === selectedCategory
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-asc':
            return a.price - b.price
          case 'price-desc':
            return b.price - a.price
          case 'name':
          default:
            return a.name.localeCompare(b.name)
        }
      })
  }, [products, selectedCategory, sortBy])

  const getCategoryCount = (category: string) => {
    if (category === 'todos') return products.length
    return products.filter(i => i.category?.slug === category).length
  }

  const getCategoryIcon = (categorySlug?: string) => {
    const cat = categories.find(c => c.id === categorySlug)
    return cat?.icon || '🍰'
  }

  const getPrimaryImage = (item: PastryItem) => {
    if (!item.images || item.images.length === 0) return null
    const primary = item.images.find(img => img.is_primary)
    return primary?.url || item.images[0]?.url
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-dark-light text-lg">Cargando productos...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="text-red-600 mb-4 text-5xl">⚠️</div>
          <h2 className="text-2xl font-bold text-dark mb-4">Error al cargar productos</h2>
          <p className="text-dark-light mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-secondary to-accent/10 py-16 md:py-20 overflow-hidden">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary/30 rounded-full" />
            <div className="absolute top-20 right-20 w-32 h-32 border-2 border-accent/30 rounded-full" />
            <div className="absolute bottom-20 left-1/4 w-24 h-24 border-2 border-primary/30 rounded-full" />
          </div>
        </div>

        {/* Gradient Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-primary font-medium mb-6 shadow-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              {products.length} productos disponibles
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-dark mb-6">
              Pastelería <span className="text-primary">Artesanal</span>
            </h1>
            <p className="text-lg md:text-xl text-dark-light leading-relaxed max-w-2xl mx-auto">
              Delicias frescas horneadas diariamente con amor. Elaboradas con ingredientes de primera calidad.
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {categories.slice(1).map((cat) => (
                <div key={cat.id} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-sm font-medium text-dark">{getCategoryCount(cat.id)} {cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-display text-lg font-semibold text-dark mb-4">Categoría</h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-white'
                        : 'bg-secondary hover:bg-primary/10 text-dark'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <span className="text-sm opacity-80">{getCategoryCount(cat.id)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-accent/10 rounded-2xl p-6">
              <h4 className="font-display text-lg font-semibold text-dark mb-3">Frescura Garantizada</h4>
              <p className="text-sm text-dark-light leading-relaxed">
                Todos nuestros productos son horneados diariamente para garantizar
                la máxima frescura y sabor.
              </p>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <p className="text-dark-light">
                  <span className="font-semibold text-dark text-2xl">{filteredProducts.length}</span>{' '}
                  <span className="text-lg">
                    {filteredProducts.length === 1 ? 'producto' : 'productos'}
                    {selectedCategory !== 'todos' && (
                      <span className="text-primary font-medium">
                        {' '}de {categories.find(c => c.id === selectedCategory)?.name.toLowerCase()}
                      </span>
                    )}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-dark-light whitespace-nowrap">
                  Ordenar por:
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-4 py-2 border border-border rounded-lg bg-white text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                >
                  <option value="name">Nombre</option>
                  <option value="price-asc">Precio: Menor a Mayor</option>
                  <option value="price-desc">Precio: Mayor a Menor</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((item) => {
                  const imageUrl = getPrimaryImage(item)

                  return (
                    <div
                      key={item.id}
                      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-transparent hover:border-primary/10"
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-secondary to-primary/5">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center transform group-hover:scale-110 transition-transform duration-500">
                              <div className="text-6xl mb-2">{getCategoryIcon(item.category?.slug)}</div>
                            </div>
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

                        {/* Quick view button */}
                        <button
                          onClick={() => setSelectedProduct(item)}
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500"
                        >
                          <span className="px-6 py-2.5 bg-white text-dark font-semibold rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            Ver detalles
                          </span>
                        </button>

                        {/* Featured Badge */}
                        {item.is_featured && (
                          <div className="absolute top-4 left-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-primary font-semibold rounded-full text-xs shadow-md">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Destacado
                            </span>
                          </div>
                        )}

                        {/* Category Badge */}
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-dark">
                            {item.category?.name || 'Pastelería'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-display text-lg font-bold text-dark mb-2 group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>

                        <p className="text-dark-light text-sm mb-4 line-clamp-2">
                          {item.description || 'Delicioso producto artesanal'}
                        </p>

                        {/* Price */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <span className="text-xl font-bold text-accent font-display">
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                          <div className="text-xs text-dark-light bg-secondary/50 px-2.5 py-1 rounded-full">
                            {item.unit}
                          </div>
                        </div>

                        {/* CTA */}
                        <Link
                          href="/agendar"
                          className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary/10 text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-all duration-300"
                        >
                          <span>Agregar al pedido</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-dark mb-2">No se encontraron productos</h3>
                <p className="text-dark-light">
                  Intenta ajustar los filtros para ver más resultados
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          productType="pastry"
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <WhatsAppButton />
    </>
  )
}
