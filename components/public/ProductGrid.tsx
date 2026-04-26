'use client'

import { useRef } from 'react'
import { ProductCard } from './ProductCard'
import { useStaggerChildren } from '@/hooks/useAnimations'
import type { ProductWithImages } from '@/types'

interface ProductGridProps {
  products: ProductWithImages[]
  productType?: 'cake' | 'cocktail' | 'pastry'
}

export function ProductGrid({ products, productType = 'cake' }: ProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  useStaggerChildren(gridRef, products.length)

  if (products.length === 0) {
    return (
      <div className="col-span-full text-center py-20">
        <div className="mb-4 flex justify-center">
          <svg className="w-16 h-16 text-dark-light/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
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
        <ProductCard key={product.id} product={product} productType={productType} />
      ))}
    </div>
  )
}
