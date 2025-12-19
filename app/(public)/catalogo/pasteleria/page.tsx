'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/format'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'

interface PastryItem {
  id: string
  name: string
  slug: string
  description: string
  short_description: string
  base_price: number
  unit: string
  is_featured: boolean
  category: 'postres' | 'panaderia' | 'galletas'
}

// Productos de pastelería
const pastryItems: PastryItem[] = [
  // Postres
  {
    id: '1',
    name: 'Pie de Limón',
    slug: 'pie-limon',
    description: 'Crujiente base de galleta, relleno cremoso de limón y merengue italiano tostado. El equilibrio perfecto entre dulce y ácido.',
    short_description: 'Cremoso, cítrico y delicioso',
    base_price: 45000,
    unit: 'porción 8 personas',
    is_featured: true,
    category: 'postres',
  },
  {
    id: '2',
    name: 'Cheesecake New York',
    slug: 'cheesecake-new-york',
    description: 'Auténtico cheesecake estilo New York, cremoso y denso, con base de galleta graham y topping de frutas.',
    short_description: 'Cremoso estilo americano',
    base_price: 55000,
    unit: 'porción 10 personas',
    is_featured: true,
    category: 'postres',
  },
  {
    id: '3',
    name: 'Tiramisú',
    slug: 'tiramisu',
    description: 'Clásico italiano con bizcochos remojados en café, crema de mascarpone y cacao. Suave y sofisticado.',
    short_description: 'Café y mascarpone italiano',
    base_price: 50000,
    unit: 'porción 8 personas',
    is_featured: true,
    category: 'postres',
  },
  {
    id: '4',
    name: 'Mousse de Maracuyá',
    slug: 'mousse-maracuya',
    description: 'Ligero mousse de maracuyá con base de galleta y cobertura de frutas frescas. Tropical y refrescante.',
    short_description: 'Tropical y refrescante',
    base_price: 48000,
    unit: 'porción 8 personas',
    is_featured: false,
    category: 'postres',
  },
  {
    id: '5',
    name: 'Flan de Caramelo',
    slug: 'flan-caramelo',
    description: 'Tradicional flan de caramelo casero, suave y cremoso, con caramelo líquido abundante.',
    short_description: 'Casero y tradicional',
    base_price: 35000,
    unit: 'porción 8 personas',
    is_featured: false,
    category: 'postres',
  },
  // Panadería
  {
    id: '6',
    name: 'Rollitos de Canela',
    slug: 'rollitos-canela',
    description: 'Recién horneados, suaves y esponjosos, con glaseado de queso crema. El aroma irresistible de la canela.',
    short_description: 'Suaves con glaseado',
    base_price: 28000,
    unit: 'bandeja 6 unidades',
    is_featured: true,
    category: 'panaderia',
  },
  {
    id: '7',
    name: 'Croissants de Mantequilla',
    slug: 'croissants',
    description: 'Croissants artesanales con mantequilla francesa, crujientes por fuera y suaves por dentro.',
    short_description: 'Mantequilla francesa',
    base_price: 25000,
    unit: 'bandeja 6 unidades',
    is_featured: false,
    category: 'panaderia',
  },
  {
    id: '8',
    name: 'Pan de Chocolate',
    slug: 'pan-chocolate',
    description: 'Pain au chocolat con barras de chocolate belga, perfecto para el desayuno o la merienda.',
    short_description: 'Chocolate belga',
    base_price: 30000,
    unit: 'bandeja 6 unidades',
    is_featured: false,
    category: 'panaderia',
  },
  {
    id: '9',
    name: 'Muffins Variados',
    slug: 'muffins',
    description: 'Esponjosos muffins en sabores: chocolate, arándanos, vainilla con chips o zanahoria.',
    short_description: 'Variedad de sabores',
    base_price: 22000,
    unit: 'bandeja 6 unidades',
    is_featured: false,
    category: 'panaderia',
  },
  // Galletas
  {
    id: '10',
    name: 'Galletas Chips de Chocolate',
    slug: 'galletas-chocolate',
    description: 'Galletas con abundantes chips de chocolate, crujientes por fuera y suaves por dentro.',
    short_description: 'Abundante chocolate',
    base_price: 18000,
    unit: 'docena',
    is_featured: true,
    category: 'galletas',
  },
  {
    id: '11',
    name: 'Galletas de Avena y Pasas',
    slug: 'galletas-avena',
    description: 'Nutritivas galletas de avena con pasas y un toque de canela. Perfectas para cualquier momento.',
    short_description: 'Nutritivas y deliciosas',
    base_price: 16000,
    unit: 'docena',
    is_featured: false,
    category: 'galletas',
  },
  {
    id: '12',
    name: 'Alfajores de Maicena',
    slug: 'alfajores-maicena',
    description: 'Delicados alfajores de maicena rellenos de arequipe y cubiertos de coco rallado.',
    short_description: 'Arequipe y coco',
    base_price: 20000,
    unit: 'docena',
    is_featured: false,
    category: 'galletas',
  },
]

const categories = [
  { id: 'todos', name: 'Todos', icon: '🍰' },
  { id: 'postres', name: 'Postres', icon: '🍮' },
  { id: 'panaderia', name: 'Panadería', icon: '🥐' },
  { id: 'galletas', name: 'Galletas', icon: '🍪' },
]

export default function PasteleriaPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('name')

  const filteredProducts = useMemo(() => {
    return pastryItems
      .filter((item) => {
        if (selectedCategory === 'todos') return true
        return item.category === selectedCategory
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
  }, [selectedCategory, sortBy])

  const getCategoryCount = (category: string) => {
    if (category === 'todos') return pastryItems.length
    return pastryItems.filter(i => i.category === category).length
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'postres': return '🍮'
      case 'panaderia': return '🥐'
      case 'galletas': return '🍪'
      default: return '🍰'
    }
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
              {pastryItems.length} productos disponibles
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-dark mb-6">
              Pastelería <span className="text-primary">Artesanal</span>
            </h1>
            <p className="text-lg md:text-xl text-dark-light leading-relaxed max-w-2xl mx-auto">
              Delicias frescas horneadas diariamente con amor. Postres, panadería y galletas
              elaboradas con ingredientes de primera calidad.
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-transparent hover:border-primary/10"
                >
                  {/* Image Placeholder */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-secondary to-primary/5">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center transform group-hover:scale-110 transition-transform duration-500">
                        <div className="text-6xl mb-2">{getCategoryIcon(item.category)}</div>
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

                    {/* Quick view */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <span className="px-6 py-2.5 bg-white text-dark font-semibold rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        Ver detalles
                      </span>
                    </div>

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
                        {categories.find(c => c.id === item.category)?.name}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-display text-lg font-bold text-dark mb-2 group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>

                    <p className="text-dark-light text-sm mb-4 line-clamp-2">
                      {item.short_description}
                    </p>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xl font-bold text-accent font-display">
                          {formatCurrency(item.base_price)}
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
              ))}
            </div>
          </div>
        </div>
      </div>

      <WhatsAppButton />
    </>
  )
}
