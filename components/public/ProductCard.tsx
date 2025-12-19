'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/format'
import { Card, Badge } from '@/components/ui'
import type { ProductWithImages } from '@/types'

interface ProductCardProps {
  product: ProductWithImages
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link href={`/catalogo/${product.slug}`}>
      <Card
        variant="white"
        hoverable
        className="h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] mb-3 rounded-xl overflow-hidden bg-secondary">
          {/* Placeholder - replace with actual image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-1">🎂</div>
              <p className="text-xs text-dark-light">Imagen del producto</p>
            </div>
          </div>

          {/* Featured Badge */}
          {product.is_featured && (
            <div className="absolute top-2 right-2">
              <Badge variant="primary">Destacado</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <h3 className="font-display text-lg font-semibold text-dark mb-1.5 line-clamp-1">
            {product.name}
          </h3>

          {product.short_description && (
            <p className="text-sm text-dark-light mb-3 line-clamp-2">
              {product.short_description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-bold text-accent font-display">
              {formatCurrency(product.base_price)}
            </span>
            <span className="text-xs text-dark-light">desde</span>
          </div>

          {/* Details */}
          <div className="flex items-center gap-3 text-xs text-dark-light mb-3">
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>
                {product.min_portions}-{product.max_portions} porciones
              </span>
            </div>
            {product.is_customizable && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
                <span>Personalizable</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div
            className={`flex items-center gap-2 text-primary font-semibold text-sm transition-all duration-200 ${
              isHovered ? 'translate-x-2' : ''
            }`}
          >
            <span>Ver detalles</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </div>
        </div>
      </Card>
    </Link>
  )
}
