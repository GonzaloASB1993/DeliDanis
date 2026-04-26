'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/format'

interface ProductImage {
  id: string
  url: string
  alt_text?: string | null
  is_primary: boolean
}

interface ProductDetailModalProps {
  product: {
    id: string
    name: string
    slug: string
    description?: string | null
    price?: number | null
    base_price?: number | null
    price_per_portion?: number | null
    min_portions?: number | null
    max_portions?: number | null
    preparation_days?: number | null
    unit?: string | null
    min_order_quantity?: number | null
    is_featured?: boolean | null
    is_customizable?: boolean | null
    category?: {
      name: string
    } | null
    subcategory?: {
      name: string
    } | null
    images?: ProductImage[]
  }
  productType: 'cake' | 'cocktail' | 'pastry'
  onClose: () => void
}

export function ProductDetailModal({ product, productType, onClose }: ProductDetailModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Estado para porciones (solo tortas)
  const minPortions = product.min_portions || 15
  const maxPortions = product.max_portions || 80
  const [portions, setPortions] = useState(minPortions)

  const images = product.images || []
  const hasImages = images.length > 0
  const currentImage = hasImages ? images[selectedImageIndex] : null

  // Calcular precio dinámico para tortas
  const calculatedPrice = useMemo(() => {
    if (productType === 'cake') {
      const basePrice = product.base_price || 0
      const pricePerPortion = product.price_per_portion || 0
      const extraPortions = Math.max(0, portions - minPortions)
      return basePrice + (extraPortions * pricePerPortion)
    }
    return product.price || 0
  }, [productType, product.base_price, product.price_per_portion, product.price, portions, minPortions])

  const getTypeLabel = () => {
    switch (productType) {
      case 'cake':
        return 'Torta'
      case 'cocktail':
        return 'Coctelería'
      case 'pastry':
        return 'Pastelería'
    }
  }

  const handlePortionChange = (delta: number) => {
    const newPortions = portions + delta
    if (newPortions >= minPortions && newPortions <= maxPortions) {
      setPortions(newPortions)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal - Más compacto */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
          >
            <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col md:flex-row">
            {/* Image Section - Más compacto */}
            <div className="relative bg-gradient-to-br from-secondary to-primary/10 md:w-2/5">
              {/* Main Image */}
              <div className="aspect-square relative">
                {currentImage ? (
                  <Image
                    src={currentImage.url}
                    alt={currentImage.alt_text || product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-16 h-16 text-dark-light/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d={
                        productType === 'cake'
                          ? 'M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.701 2.701 0 001 15.546M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z'
                          : productType === 'cocktail'
                          ? 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                          : 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                      } />
                    </svg>
                  </div>
                )}

                {/* Featured badge */}
                {product.is_featured && (
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-sm text-primary text-xs font-semibold rounded-full shadow">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Destacado
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex gap-1.5 justify-center">
                    {images.slice(0, 4).map((img, index) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                          index === selectedImageIndex
                            ? 'border-primary shadow-lg scale-105'
                            : 'border-white/50 hover:border-white'
                        }`}
                      >
                        <Image
                          src={img.url}
                          alt={img.alt_text || `${product.name} ${index + 1}`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-5 md:w-3/5 overflow-y-auto max-h-[50vh] md:max-h-[85vh]">
              {/* Category & Type */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  {getTypeLabel()}
                </span>
                {product.category && (
                  <span className="px-2 py-0.5 bg-secondary text-dark rounded-full text-xs font-medium">
                    {product.category.name}
                  </span>
                )}
              </div>

              {/* Name */}
              <h2 className="font-display text-xl md:text-2xl font-bold text-dark mb-2">
                {product.name}
              </h2>

              {/* Description */}
              {product.description && (
                <p className="text-dark-light text-sm leading-relaxed mb-4 line-clamp-3">
                  {product.description}
                </p>
              )}

              {/* Selector de porciones para tortas */}
              {productType === 'cake' && (
                <div className="bg-secondary/50 rounded-xl p-4 mb-4">
                  <label className="block text-sm font-medium text-dark mb-2">
                    Porciones
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePortionChange(-5)}
                      disabled={portions <= minPortions}
                      className="w-9 h-9 rounded-full bg-white border border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-colors flex items-center justify-center font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-bold text-dark">{portions}</span>
                      <span className="text-sm text-dark-light ml-1">personas</span>
                    </div>
                    <button
                      onClick={() => handlePortionChange(5)}
                      disabled={portions >= maxPortions}
                      className="w-9 h-9 rounded-full bg-white border border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-colors flex items-center justify-center font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-dark-light mt-2 text-center">
                    Rango: {minPortions} - {maxPortions} porciones
                  </p>
                </div>
              )}

              {/* Price */}
              <div className="bg-secondary rounded-xl p-4 mb-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-dark-light mb-0.5">
                      {productType === 'cake' ? 'Precio total' : 'Precio'}
                    </p>
                    <p className="font-display text-2xl md:text-3xl font-bold text-accent">
                      {formatCurrency(calculatedPrice)}
                    </p>
                  </div>
                  {product.unit && (
                    <span className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-dark">
                      por {product.unit}
                    </span>
                  )}
                </div>

                {/* Info adicional de precio para tortas */}
                {productType === 'cake' && product.price_per_portion && product.price_per_portion > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/50 text-xs text-dark-light">
                    <div className="flex justify-between">
                      <span>Precio base ({minPortions} porciones)</span>
                      <span>{formatCurrency(product.base_price || 0)}</span>
                    </div>
                    {portions > minPortions && (
                      <div className="flex justify-between mt-1">
                        <span>+{portions - minPortions} porciones extra</span>
                        <span>+{formatCurrency((portions - minPortions) * product.price_per_portion)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Details compactos */}
              <div className="flex flex-wrap gap-3 mb-4 text-xs">
                {productType === 'cake' && product.preparation_days && (
                  <div className="flex items-center gap-1.5 text-dark-light">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{product.preparation_days} días anticipación</span>
                  </div>
                )}
                {product.is_customizable && (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Personalizable</span>
                  </div>
                )}
                {(productType === 'cocktail' || productType === 'pastry') && product.min_order_quantity && (
                  <div className="flex items-center gap-1.5 text-dark-light">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>Mín. {product.min_order_quantity} unidades</span>
                  </div>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-2">
                <Link
                  href="/agendar"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Agendar
                </Link>
                <a
                  href={`https://wa.me/56939282764?text=Hola, me interesa: ${product.name}${productType === 'cake' ? ` para ${portions} personas` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Consultar
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
