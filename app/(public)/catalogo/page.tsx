'use client'

import { useState, useMemo } from 'react'
import { EventTypeFilter, type EventType } from '@/components/public/EventTypeFilter'
import { PriceFilter } from '@/components/public/PriceFilter'
import { ProductGrid } from '@/components/public/ProductGrid'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
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

// Mock data - SABORES con tipos de eventos disponibles
const mockProducts: ProductWithImages[] = [
  {
    id: '1',
    category_id: '1',
    name: 'Torta de Chocolate',
    slug: 'torta-chocolate',
    description: 'Bizcocho de chocolate belga con ganache de chocolate semi-amargo y decoración elegante. Perfecta para cualquier ocasión especial.',
    short_description: 'Chocolate belga premium con ganache',
    base_price: 180000,
    min_portions: 15,
    max_portions: 100,
    price_per_portion: 8000,
    preparation_days: 3,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: { event_types: ['bodas', 'cumpleanos', 'aniversarios', 'corporativos', 'quinceaneras'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '2',
    category_id: '2',
    name: 'Torta Hojarasca',
    slug: 'torta-hojarasca',
    description: 'Capas de hojaldre crujiente con arequipe casero y merengue italiano. Un clásico colombiano irresistible.',
    short_description: 'Hojaldre y arequipe artesanal',
    base_price: 160000,
    min_portions: 15,
    max_portions: 80,
    price_per_portion: 7500,
    preparation_days: 3,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: { event_types: ['bodas', 'cumpleanos', 'aniversarios', 'baby-shower'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '3',
    category_id: '3',
    name: 'Torta Amor (Fresas con Crema)',
    slug: 'torta-amor',
    description: 'Clásica torta de fresas frescas con crema chantilly y bizcocho esponjoso. Ligera y deliciosa.',
    short_description: 'Fresas frescas con crema chantilly',
    base_price: 150000,
    min_portions: 15,
    max_portions: 80,
    price_per_portion: 7000,
    preparation_days: 2,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: { event_types: ['cumpleanos', 'baby-shower', 'aniversarios', 'quinceaneras'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '4',
    category_id: '4',
    name: 'Torta Tres Leches',
    slug: 'torta-tres-leches',
    description: 'Bizcocho empapado en mezcla de tres leches con crema batida. Suave, húmeda y delicada.',
    short_description: 'Suave y húmeda, un clásico irresistible',
    base_price: 140000,
    min_portions: 15,
    max_portions: 80,
    price_per_portion: 6500,
    preparation_days: 2,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: { event_types: ['cumpleanos', 'bautizos', 'primera-comunion', 'baby-shower', 'aniversarios'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '5',
    category_id: '5',
    name: 'Torta Red Velvet',
    slug: 'torta-red-velvet',
    description: 'Bizcocho aterciopelado con frosting de queso crema y toque de cacao. Elegante y sofisticada.',
    short_description: 'Suave textura con queso crema',
    base_price: 190000,
    min_portions: 15,
    max_portions: 100,
    price_per_portion: 8500,
    preparation_days: 3,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: { event_types: ['bodas', 'aniversarios', 'quinceaneras', 'corporativos'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '6',
    category_id: '6',
    name: 'Torta de Zanahoria',
    slug: 'torta-zanahoria',
    description: 'Bizcocho especiado con zanahoria, nueces y frosting de queso crema. Perfecta para quienes buscan algo diferente.',
    short_description: 'Especiada con nueces y queso crema',
    base_price: 170000,
    min_portions: 15,
    max_portions: 80,
    price_per_portion: 7500,
    preparation_days: 3,
    is_customizable: true,
    is_active: true,
    is_featured: false,
    metadata: { event_types: ['cumpleanos', 'baby-shower', 'aniversarios', 'corporativos'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '7',
    category_id: '7',
    name: 'Torta de Vainilla',
    slug: 'torta-vainilla',
    description: 'Bizcocho de vainilla natural con buttercream suave. Un lienzo perfecto para cualquier decoración.',
    short_description: 'Clásica y versátil para cualquier evento',
    base_price: 130000,
    min_portions: 15,
    max_portions: 100,
    price_per_portion: 6000,
    preparation_days: 2,
    is_customizable: true,
    is_active: true,
    is_featured: false,
    metadata: { event_types: ['bodas', 'cumpleanos', 'bautizos', 'primera-comunion', 'baby-shower', 'quinceaneras'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '8',
    category_id: '8',
    name: 'Torta de Limón',
    slug: 'torta-limon',
    description: 'Bizcocho de limón con relleno de lemon curd y merengue italiano. Fresca y cítrica.',
    short_description: 'Fresca y cítrica con lemon curd',
    base_price: 165000,
    min_portions: 15,
    max_portions: 80,
    price_per_portion: 7500,
    preparation_days: 3,
    is_customizable: true,
    is_active: true,
    is_featured: false,
    metadata: { event_types: ['bodas', 'cumpleanos', 'baby-shower', 'aniversarios', 'corporativos'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '9',
    category_id: '9',
    name: 'Torta Selva Negra',
    slug: 'torta-selva-negra',
    description: 'Bizcocho de chocolate con cerezas, crema chantilly y virutas de chocolate. Un clásico alemán.',
    short_description: 'Chocolate, cerezas y crema',
    base_price: 195000,
    min_portions: 15,
    max_portions: 90,
    price_per_portion: 8500,
    preparation_days: 3,
    is_customizable: true,
    is_active: true,
    is_featured: false,
    metadata: { event_types: ['bodas', 'cumpleanos', 'aniversarios', 'corporativos'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '10',
    category_id: '10',
    name: 'Torta de Coco',
    slug: 'torta-coco',
    description: 'Bizcocho con coco rallado y crema de coco. Tropical y deliciosa.',
    short_description: 'Tropical con coco natural',
    base_price: 155000,
    min_portions: 15,
    max_portions: 80,
    price_per_portion: 7000,
    preparation_days: 2,
    is_customizable: true,
    is_active: true,
    is_featured: false,
    metadata: { event_types: ['cumpleanos', 'baby-shower', 'bautizos', 'primera-comunion'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '11',
    category_id: '11',
    name: 'Torta Marmoleada',
    slug: 'torta-marmoleada',
    description: 'Combinación perfecta de vainilla y chocolate en un delicioso bizcocho marmoleado.',
    short_description: 'Lo mejor de dos mundos',
    base_price: 145000,
    min_portions: 15,
    max_portions: 80,
    price_per_portion: 6500,
    preparation_days: 2,
    is_customizable: true,
    is_active: true,
    is_featured: false,
    metadata: { event_types: ['cumpleanos', 'bautizos', 'primera-comunion', 'baby-shower'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '12',
    category_id: '12',
    name: 'Torta Ópera',
    slug: 'torta-opera',
    description: 'Sofisticada torta francesa con capas de almendra, café y chocolate. Para paladares exigentes.',
    short_description: 'Sofisticación francesa',
    base_price: 220000,
    min_portions: 20,
    max_portions: 80,
    price_per_portion: 9500,
    preparation_days: 4,
    is_customizable: true,
    is_active: true,
    is_featured: false,
    metadata: { event_types: ['bodas', 'aniversarios', 'corporativos'] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
]

export default function CatalogoPage() {
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity })
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('name')

  // Calcular conteo de productos por tipo de evento
  const eventTypesWithCount = useMemo(() => {
    return eventTypes.map((eventType) => ({
      ...eventType,
      count: mockProducts.filter((product) => {
        const productEventTypes = product.metadata?.event_types as string[] || []
        return productEventTypes.includes(eventType.slug)
      }).length,
    }))
  }, [])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return mockProducts
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
  }, [selectedEventType, priceRange, sortBy])

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
              {mockProducts.length} sabores únicos
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
            <ProductGrid products={filteredProducts} />
          </div>
        </div>
      </div>

      <WhatsAppButton />
    </>
  )
}
