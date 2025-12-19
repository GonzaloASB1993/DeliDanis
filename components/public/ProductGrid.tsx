'use client'

import { useRef } from 'react'
import { ProductCard } from './ProductCard'
import { useStaggerChildren } from '@/hooks/useAnimations'
import type { ProductWithImages } from '@/types'

interface ProductGridProps {
  products: ProductWithImages[]
}

export function ProductGrid({ products }: ProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  useStaggerChildren(gridRef)

  if (products.length === 0) {
    return (
      <div className="col-span-full text-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-2xl font-display font-semibold text-dark mb-2">
          No se encontraron productos
        </h3>
        <p className="text-dark-light">
          Intenta ajustar los filtros para encontrar lo que buscas
        </p>
      </div>
    )
  }

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
