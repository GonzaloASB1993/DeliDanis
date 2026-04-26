'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format'
import type { ProductWithImages } from '@/types'

interface ProductSelectorProps {
  products: ProductWithImages[]
  selectedProduct: ProductWithImages | null
  onSelectProduct: (product: ProductWithImages) => void
}

export function ProductSelector({
  products,
  selectedProduct,
  onSelectProduct,
}: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (product: ProductWithImages) => {
    onSelectProduct(product)
    setIsOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Selected Product Display */}
      {selectedProduct ? (
        <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-primary">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-secondary to-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden relative">
              {selectedProduct.images?.[0] ? (
                <Image
                  src={selectedProduct.images.find(img => img.is_primary)?.url || selectedProduct.images[0].url}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <svg className="w-12 h-12 text-dark-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.701 2.701 0 001 15.546M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-display text-2xl font-bold text-dark mb-1">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-dark-light mb-3">
                    {selectedProduct.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-sm text-dark-light mb-1">Precio base</p>
                  <p className="text-2xl font-bold text-accent font-display">
                    {formatCurrency(selectedProduct.base_price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-dark-light mb-1">Porciones</p>
                  <p className="text-lg font-semibold text-dark">
                    {selectedProduct.min_portions} - {selectedProduct.max_portions}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-dark-light mb-1">Preparación</p>
                  <p className="text-lg font-semibold text-dark">
                    {selectedProduct.preparation_days} días
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-secondary/50 rounded-2xl p-8 text-center border-2 border-dashed border-border">
          <div className="flex justify-center mb-3">
            <svg className="w-12 h-12 text-dark-light/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.701 2.701 0 001 15.546M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
            </svg>
          </div>
          <p className="text-dark-light">Selecciona un sabor para continuar</p>
        </div>
      )}

      {/* Dropdown Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full px-6 py-4 bg-white border-2 rounded-xl flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-md',
            isOpen ? 'border-primary ring-4 ring-primary/10' : 'border-border hover:border-primary/50'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm text-dark-light">Sabor seleccionado</p>
              <p className="font-semibold text-dark">
                {selectedProduct ? selectedProduct.name : 'Elige tu sabor favorito'}
              </p>
            </div>
          </div>
          <svg
            className={cn(
              'w-5 h-5 text-dark-light transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-border max-h-[500px] overflow-y-auto">
            <div className="p-2">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className={cn(
                    'w-full p-4 rounded-lg transition-all duration-200 text-left hover:bg-primary/5',
                    selectedProduct?.id === product.id && 'bg-primary/10 ring-2 ring-primary/20'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-secondary to-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images.find(img => img.is_primary)?.url || product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <svg className="w-7 h-7 text-dark-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.701 2.701 0 001 15.546M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-dark truncate">
                          {product.name}
                        </h4>
                        {selectedProduct?.id === product.id && (
                          <svg
                            className="w-5 h-5 text-primary flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-dark-light mb-2 line-clamp-2">
                        {product.short_description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-dark-light">
                        <span className="font-semibold text-accent">
                          {formatCurrency(product.base_price)}
                        </span>
                        <span>•</span>
                        <span>{product.min_portions}-{product.max_portions} porciones</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 text-center border border-primary/20">
          <div className="flex justify-center mb-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-dark">Personalizable</p>
          <p className="text-xs text-dark-light mt-1">100% a tu gusto</p>
        </div>
        <div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl p-4 text-center border border-accent/20">
          <div className="flex justify-center mb-2">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-dark">Calidad Premium</p>
          <p className="text-xs text-dark-light mt-1">Ingredientes selectos</p>
        </div>
        <div className="bg-gradient-to-br from-success/5 to-success/10 rounded-xl p-4 text-center border border-success/20">
          <div className="flex justify-center mb-2">
            <svg className="w-6 h-6 text-success-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-dark">Hecho con Amor</p>
          <p className="text-xs text-dark-light mt-1">Artesanal</p>
        </div>
      </div>
    </div>
  )
}
