'use client'

import { useState, useMemo } from 'react'
import { EventTypeFilter, type EventType } from '@/components/public/EventTypeFilter'
import { PriceFilter } from '@/components/public/PriceFilter'
import { ProductGrid } from '@/components/public/ProductGrid'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { PageHeader, PageHeaderChip } from '@/components/public/PageHeader'
import type { ProductWithImages } from '@/types'

const eventTypes: EventType[] = [
  { id: '1', name: 'Bodas', slug: 'bodas', icon: 'bodas' },
  { id: '2', name: 'Quinceañeras', slug: 'quinceaneras', icon: 'quinceaneras' },
  { id: '3', name: 'Cumpleaños', slug: 'cumpleanos', icon: 'cumpleanos' },
  { id: '4', name: 'Bautizos', slug: 'bautizos', icon: 'bautizos' },
  { id: '5', name: 'Primera Comunión', slug: 'primera-comunion', icon: 'primera-comunion' },
  { id: '6', name: 'Baby Shower', slug: 'baby-shower', icon: 'baby-shower' },
  { id: '7', name: 'Corporativos', slug: 'corporativos', icon: 'corporativos' },
  { id: '8', name: 'Aniversarios', slug: 'aniversarios', icon: 'aniversarios' },
]

interface Props {
  initialProducts: ProductWithImages[]
}

export function CatalogoClient({ initialProducts }: Props) {
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity })
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('name')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const activeFiltersCount = (selectedEventType ? 1 : 0) + (priceRange.max !== Infinity || priceRange.min > 0 ? 1 : 0)

  const eventTypesWithCount = useMemo(() => {
    return eventTypes.map((eventType) => ({
      ...eventType,
      count: initialProducts.filter((product) => {
        const productEventTypes = product.metadata?.event_types as string[] || []
        return productEventTypes.includes(eventType.slug)
      }).length,
    }))
  }, [initialProducts])

  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((product) => {
        if (selectedEventType) {
          const productEventTypes = product.metadata?.event_types as string[] || []
          if (!productEventTypes.includes(selectedEventType)) return false
        }
        if (product.base_price < priceRange.min || product.base_price > priceRange.max) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-asc': return a.base_price - b.base_price
          case 'price-desc': return b.base_price - a.base_price
          default: return a.name.localeCompare(b.name)
        }
      })
  }, [initialProducts, selectedEventType, priceRange, sortBy])

  return (
    <>
      <PageHeader
        eyebrow={{
          text: 'Catálogo',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          ),
        }}
        title={
          <>
            Nuestros <span className="text-primary italic font-accent">sabores</span>
          </>
        }
        description="Explora nuestra colección de tortas artesanales, pensadas para los momentos que merecen ser recordados."
        meta={
          <>
            <PageHeaderChip
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
              }
            >
              {initialProducts.length} sabores únicos
            </PageHeaderChip>
            <PageHeaderChip
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7m-4-7h11" />
                </svg>
              }
            >
              Personalizables
            </PageHeaderChip>
            <PageHeaderChip
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              }
            >
              Ingredientes premium
            </PageHeaderChip>
          </>
        }
      />

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <p className="text-dark-light">
                  <span className="font-semibold text-dark text-2xl">{filteredProducts.length}</span>{' '}
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
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg bg-white text-dark text-sm hover:border-primary/50 transition-colors relative"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtros
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
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

            {filteredProducts.length > 0 ? (
              <ProductGrid products={filteredProducts} />
            ) : (
              <div className="text-center py-12">
                <div className="mb-4 flex justify-center">
                  <svg className="w-16 h-16 text-dark-light/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-dark mb-2">No se encontraron productos</h3>
                <p className="text-dark-light">Intenta ajustar los filtros para ver más resultados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <WhatsAppButton />

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-dark/40 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-white">
              <span className="font-display text-lg font-bold text-dark">Filtros</span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 rounded-lg hover:bg-secondary text-dark-light hover:text-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-6">
              <EventTypeFilter
                eventTypes={eventTypesWithCount}
                selectedEventType={selectedEventType}
                onSelectEventType={(v) => { setSelectedEventType(v); setMobileFiltersOpen(false) }}
              />
              <PriceFilter priceRange={priceRange} onPriceChange={setPriceRange} />
            </div>
            {activeFiltersCount > 0 && (
              <div className="px-5 pb-5">
                <button
                  onClick={() => { setSelectedEventType(null); setPriceRange({ min: 0, max: Infinity }); setMobileFiltersOpen(false) }}
                  className="w-full py-2.5 border border-border rounded-full text-sm font-medium text-dark-light hover:text-dark hover:border-dark/40 transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
