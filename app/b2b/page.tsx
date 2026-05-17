'use client'

import { useEffect, useState } from 'react'
import { B2BProductGrid } from '@/components/b2b/B2BProductGrid'
import { getB2BProducts } from '@/lib/supabase/b2b-queries'
import type { B2BProduct } from '@/types/b2b'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-border animate-pulse">
      <div className="aspect-square bg-secondary" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 w-16 bg-secondary rounded" />
        <div className="h-4 w-full bg-secondary rounded" />
        <div className="h-4 w-2/3 bg-secondary rounded" />
        <div className="h-5 w-20 bg-secondary rounded" />
        <div className="h-8 w-full bg-secondary rounded-lg mt-2" />
      </div>
    </div>
  )
}

export default function B2BCatalogPage() {
  const [products, setProducts] = useState<B2BProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await getB2BProducts()
        if (cancelled) return
        setProducts(result)
      } catch {
        if (!cancelled) setError('No se pudo cargar el catálogo. Intenta nuevamente.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-dark">
          Catálogo Mayorista
        </h1>
        <p className="text-sm text-dark-light mt-1">
          Seleccioná los productos y cantidades para armar tu pedido al por mayor.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-dark-light text-sm">{error}</p>
        </div>
      ) : (
        <B2BProductGrid products={products} />
      )}
    </main>
  )
}
