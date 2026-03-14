'use client'

import { useState, useMemo, useEffect } from 'react'
import { EventTypeFilter, type EventType } from '@/components/public/EventTypeFilter'
import { PriceFilter } from '@/components/public/PriceFilter'
import { ProductGrid } from '@/components/public/ProductGrid'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { getCakeProducts } from '@/lib/supabase/product-queries'
import type { ProductWithImages } from '@/types'

// Tipos de eventos
const eventTypes: EventType[] = [
  { id: '1', name: 'Bodas', slug: 'bodas', icon: '💍' },
  { id: '2', name: 'Quinceañeras', slug: 'quinceaneras', icon: '👑' },
  { id: '3', name: 'Cumpleaños', slug: 'cumpleanos', icon: '🎈' },
  { id: '4', name: 'Bautizos', slug: 'bautizos', icon: '🕊️' },
  { id: '5', name: 'Primera Comunión', slug: 'primera-comunion', icon: '⛪' },
  { id: '6', name: 'Baby Shower', slug: 'baby-shower', icon: '👶' },
  { id: '7', name: 'Corporativos', slug: 'corporativos', icon: '💼' },
  { id: '8', name: 'Aniversarios', slug: 'aniversarios', icon: '💝' },
]

export default function CatalogoPage() {
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity })
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('name')

  // Estado para productos cargados desde BD
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar productos desde la base de datos
  useEffect(() => {
    async function loadProducts() {
      try {
        setIsLoading(true)
        const { success, products: cakeProducts } = await getCakeProducts()

        if (success) {
          setProducts(cakeProducts)
        } else {
          setError('No se pudieron cargar los productos')
        }
      } catch (err) {
        console.error('Error loading products:', err)
        setError('Error al cargar los productos')
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Calcular conteo de productos por tipo de evento
  const eventTypesWithCount = useMemo(() => {
    return eventTypes.map((eventType) => ({
      ...eventType,
      count: products.filter((product) => {
        const productEventTypes = product.metadata?.event_types as string[] || []
        return productEventTypes.includes(eventType.slug)
      }).length,
    }))
  }, [products])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Filter by event type
        if (selectedEventType) {
          const productEventTypes = product.metadata?.event_types as string[] || []
          if (!productEventTypes.includes(selectedEventType)) return false
        }

        // Filter by price
        if (
          product.base_price < priceRange.min ||
          product.base_price > priceRange.max
        ) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-asc':
            return a.base_price - b.base_price
          case 'price-desc':
            return b.base_price - a.base_price
          case 'name':
          default:
            return a.name.localeCompare(b.name)
        }
      })
  }, [products, selectedEventType, priceRange, sortBy])

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-dark-light text-lg">Cargando sabores...</p>
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
            <div className="absolute bottom-10 right-1/3 w-16 h-16 border-2 border-accent/30 rounded-full" />
          </div>
        </div>

        {/* Gradient Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/15 rounded-full blur-2xl" />
        </div>

        <div className="relative container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-primary font-medium mb-6 shadow-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              {products.length} sabores únicos
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-dark mb-6">
              Nuestros <span className="text-primary">Sabores</span>
            </h1>
            <p className="text-lg md:text-xl text-dark-light leading-relaxed max-w-2xl mx-auto">
              Explora nuestra variedad de sabores artesanales, perfectos para tu evento especial
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-dark">Personalización incluida</span>
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-dark">Ingredientes premium</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <EventTypeFilter
                eventTypes={eventTypesWithCount}
                selectedEventType={selectedEventType}
                onSelectEventType={setSelectedEventType}
              />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <PriceFilter priceRange={priceRange} onPriceChange={setPriceRange} />
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <p className="text-dark-light">
                  <span className="font-semibold text-dark text-2xl">
                    {filteredProducts.length}
                  </span>{' '}
                  <span className="text-lg">
                    {filteredProducts.length === 1 ? 'sabor' : 'sabores'}
                    {selectedEventType && (
                      <span className="text-primary font-medium">
                        {' '}para {eventTypes.find(e => e.slug === selectedEventType)?.name.toLowerCase()}
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
                  onChange={(e) =>
                    setSortBy(e.target.value as typeof sortBy)
                  }
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
              <ProductGrid products={filteredProducts} />
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

      <WhatsAppButton />
    </>
  )
}
