'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils/format'
import { ProductDetailModal } from './ProductDetailModal'
import type { ProductWithImages } from '@/types'

interface ProductCardProps {
  product: ProductWithImages
  productType?: 'cake' | 'cocktail' | 'pastry'
}

export function ProductCard({ product, productType = 'cake' }: ProductCardProps) {
  const [showDetail, setShowDetail] = useState(false)

  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]

  return (
    <>
      <article
        onClick={() => setShowDetail(true)}
        className="group card-tile card-tile-hover cursor-pointer"
      >
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt_text || product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary to-primary/5">
              <svg className="w-16 h-16 text-primary/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.701 2.701 0 001 15.546M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
              </svg>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Quick view button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
            <span className="px-5 py-2.5 bg-white/95 backdrop-blur-sm text-dark text-xs font-semibold rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-lg">
              Ver detalles
            </span>
          </div>

          {/* Featured Badge */}
          {product.is_featured && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-sm text-primary font-semibold rounded-full text-xs shadow-sm">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Destacado
              </span>
            </div>
          )}

          {/* Category Badge */}
          {product.category && (
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-dark">
                {product.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-display text-lg font-bold text-dark mb-1.5 group-hover:text-primary transition-colors duration-300 line-clamp-1">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-dark-light text-sm mb-4 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Price & Details */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-4 pt-3 border-t border-border/40">
              <div>
                <span className="text-[11px] text-dark-light uppercase tracking-wide">Desde</span>
                <p className="text-xl font-bold text-accent font-display leading-tight">
                  {formatCurrency(product.base_price || 0)}
                </p>
              </div>
              {productType === 'cake' && product.min_portions && product.max_portions && (
                <div className="text-xs text-dark-light bg-secondary/70 px-2.5 py-1 rounded-full">
                  {product.min_portions}-{product.max_portions} porc.
                </div>
              )}
            </div>

            {/* CTA */}
            <button
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary/8 text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-all duration-300 text-sm"
            >
              <span>Ver detalles</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </article>

      {/* Detail Modal */}
      {showDetail && (
        <ProductDetailModal
          product={product}
          productType={productType}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  )
}
