'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/lib/utils/format'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ProductDetailModal } from './ProductDetailModal'
import { getCakeProducts } from '@/lib/supabase/product-queries'
import type { ProductWithImages } from '@/types'

gsap.registerPlugin(ScrollTrigger)

export function FeaturedProducts() {
  const [selectedProduct, setSelectedProduct] = useState<ProductWithImages | null>(null)
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [, forceUpdate] = useState(0)

  const sectionRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  // Load featured products from DB
  useEffect(() => {
    async function loadFeaturedProducts() {
      try {
        const { success, products: allProducts } = await getCakeProducts()
        if (success && allProducts) {
          const featured = allProducts
            .filter((p: ProductWithImages) => p.is_featured)
            .slice(0, 8)
          setProducts(featured.length > 0 ? featured : allProducts.slice(0, 8))
        }
      } catch (error) {
        console.error('Error loading featured products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadFeaturedProducts()
  }, [])

  // GSAP entrance animations
  useEffect(() => {
    if (!sectionRef.current || isLoading || products.length === 0) return

    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0,
            duration: 0.7, stagger: 0.1, ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 82%',
              toggleActions: 'play none none none',
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [isLoading, products])

  // Navigation
  const getItemsToShow = useCallback(() => {
    if (typeof window === 'undefined') return 4
    if (window.innerWidth >= 1280) return 4
    if (window.innerWidth >= 1024) return 3
    if (window.innerWidth >= 640) return 2
    return 1
  }, [])

  const maxIndex = Math.max(0, products.length - getItemsToShow())

  const goNext = useCallback(() => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1))
  }, [maxIndex])

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1))
  }, [maxIndex])

  // Resize listener: recalculate itemsToShow and clamp currentIndex
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        forceUpdate(n => n + 1)
        setCurrentIndex(prev => Math.min(prev, Math.max(0, products.length - getItemsToShow())))
      }, 150)
    }
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timer) }
  }, [products, getItemsToShow])

  // Auto-play
  useEffect(() => {
    if (products.length === 0) return
    const interval = setInterval(goNext, 5000)
    return () => clearInterval(interval)
  }, [products, goNext])

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="py-16 lg:py-20 bg-gradient-to-b from-white via-secondary/30 to-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="h-3 w-36 bg-primary/10 rounded-full mx-auto mb-5 animate-pulse" />
            <div className="h-10 w-72 bg-primary/10 rounded-xl mx-auto mb-3 animate-pulse" />
            <div className="h-4 w-56 bg-primary/5 rounded mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-[4/5] bg-secondary" />
                <div className="p-5">
                  <div className="h-5 bg-secondary rounded-lg w-3/4 mb-3" />
                  <div className="h-6 bg-secondary rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) return null

  const showNavigation = products.length > getItemsToShow()

  return (
    <section
      ref={sectionRef}
      id="productos"
      className="py-16 lg:py-20 bg-gradient-to-b from-white via-secondary/30 to-white overflow-hidden"
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-10 lg:mb-12">
          <span className="inline-flex items-center gap-2 px-5 py-2 bg-primary/8 text-primary font-semibold rounded-full text-sm mb-5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Favoritos de Nuestros Clientes
          </span>

          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-dark mb-4 leading-[1.1]">
            Creaciones que{' '}
            <span className="relative inline-block">
              <span className="text-primary">Enamoran</span>
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/25" viewBox="0 0 100 12" preserveAspectRatio="none">
                <path d="M0 9 Q 50 0, 100 9" stroke="currentColor" strokeWidth="3" fill="none" />
              </svg>
            </span>
          </h2>

          <p className="text-dark-light max-w-lg mx-auto text-lg">
            Descubre nuestras tortas más solicitadas, elaboradas con pasión y los mejores ingredientes
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation arrows */}
          {showNavigation && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 lg:-translate-x-5 z-10 w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-300 border border-border/50 hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg hover:scale-105"
                aria-label="Anterior"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 lg:translate-x-5 z-10 w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-300 border border-border/50 hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg hover:scale-105"
                aria-label="Siguiente"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Carousel track */}
          <div className="overflow-hidden mx-2 lg:mx-6">
            <div
              ref={trackRef}
              className="flex gap-5 transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(calc(-${currentIndex} * (${100 / getItemsToShow()}% - ${((getItemsToShow() - 1) * 20) / getItemsToShow()}px + ${20 / getItemsToShow()}px)))`,
              }}
            >
              {products.map((product) => {
                const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]

                return (
                  <div
                    key={product.id}
                    className="group cursor-pointer flex-shrink-0"
                    style={{
                      width: `calc(${100 / getItemsToShow()}% - ${((getItemsToShow() - 1) * 20) / getItemsToShow()}px)`,
                    }}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 border border-border/20 hover:border-primary/15 h-full flex flex-col">
                      {/* Image */}
                      <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.url}
                            alt={primaryImage.alt_text || product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
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

                        {/* Quick view */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                          <span className="px-5 py-2.5 bg-white/95 backdrop-blur-sm text-dark text-xs font-semibold rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-lg">
                            Ver detalles
                          </span>
                        </div>

                        {/* Featured badge */}
                        {product.is_featured && (
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-sm text-primary font-bold rounded-full text-[10px] shadow-sm">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Top
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 lg:p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-display text-base lg:text-lg font-bold text-dark mb-1 group-hover:text-primary transition-colors duration-300 line-clamp-1">
                            {product.name}
                          </h3>
                          {product.short_description && (
                            <p className="text-sm text-dark-light mb-3 line-clamp-1 leading-relaxed">
                              {product.short_description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border/40">
                          <div>
                            <span className="text-[11px] text-dark-light uppercase tracking-wide">Desde</span>
                            <p className="text-lg font-bold text-accent font-display leading-tight">
                              {formatCurrency(product.base_price || 0)}
                            </p>
                          </div>
                          <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pagination dots */}
          {showNavigation && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 rounded-full transition-all duration-400 ${
                    i === currentIndex
                      ? 'w-8 bg-primary'
                      : 'w-2 bg-primary/20 hover:bg-primary/40'
                  }`}
                  aria-label={`Ir a slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 lg:mt-14">
          <Link href="/catalogo">
            <Button variant="secondary" size="lg" className="group">
              Explorar Catálogo Completo
              <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          productType="cake"
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  )
}
