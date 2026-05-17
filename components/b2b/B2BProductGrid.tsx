'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { B2BProductCard } from './B2BProductCard'
import type { B2BProduct } from '@/types/b2b'

type ProductType = 'all' | 'cake' | 'pastry' | 'cocktail'

const FILTERS: { label: string; value: ProductType }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Tortas', value: 'cake' },
  { label: 'Pastelería', value: 'pastry' },
  { label: 'Coctelería', value: 'cocktail' },
]

interface B2BProductGridProps {
  products: B2BProduct[]
}

export function B2BProductGrid({ products }: B2BProductGridProps) {
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<ProductType>('all')

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesType = activeType === 'all' || p.product_type === activeType
      const matchesSearch =
        search.trim() === '' ||
        p.name.toLowerCase().includes(search.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [products, activeType, search])

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-light pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-white text-dark placeholder:text-dark-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        {/* Type filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((f) => {
            const isActive = activeType === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setActiveType(f.value)}
                className={[
                  'px-4 py-1.5 text-sm font-medium rounded-full border transition-colors',
                  isActive
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-dark-light hover:border-primary hover:text-dark',
                ].join(' ')}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-dark-light py-16 text-sm">
          No se encontraron productos.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <B2BProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
