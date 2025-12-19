'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/lib/utils/format'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import type { ProductWithImages } from '@/types'

gsap.registerPlugin(ScrollTrigger)

interface FeaturedProductsProps {
  products?: ProductWithImages[]
}

// Mock data - Enfocado en SABORES
const mockProducts: ProductWithImages[] = [
  {
    id: '1',
    category_id: '1',
    name: 'Torta de Chocolate',
    slug: 'torta-chocolate',
    description: 'Bizcocho de chocolate belga con ganache de chocolate semi-amargo y decoración elegante',
    short_description: 'Chocolate belga premium con ganache',
    base_price: 180000,
    min_portions: 15,
    max_portions: 80,
    price_per_portion: 8000,
    preparation_days: 3,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '2',
    category_id: '2',
    name: 'Torta Hojarasca',
    slug: 'torta-hojarasca',
    description: 'Capas de hojaldre crujiente con arequipe casero y merengue italiano',
    short_description: 'Hojaldre y arequipe artesanal',
    base_price: 160000,
    min_portions: 15,
    max_portions: 70,
    price_per_portion: 7500,
    preparation_days: 3,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '3',
    category_id: '3',
    name: 'Torta Amor',
    slug: 'torta-amor',
    description: 'Clásica torta de fresas con crema chantilly y bizcocho esponjoso',
    short_description: 'Fresas frescas con crema chantilly',
    base_price: 150000,
    min_portions: 15,
    max_portions: 70,
    price_per_portion: 7000,
    preparation_days: 2,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '4',
    category_id: '4',
    name: 'Torta Tres Leches',
    slug: 'torta-tres-leches',
    description: 'Bizcocho empapado en mezcla de tres leches con crema batida',
    short_description: 'Suave y húmeda, un clásico irresistible',
    base_price: 140000,
    min_portions: 15,
    max_portions: 70,
    price_per_portion: 6500,
    preparation_days: 2,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '5',
    category_id: '5',
    name: 'Torta Red Velvet',
    slug: 'torta-red-velvet',
    description: 'Bizcocho aterciopelado con frosting de queso crema y toque de cacao',
    short_description: 'Suave textura con queso crema',
    base_price: 190000,
    min_portions: 15,
    max_portions: 80,
    price_per_portion: 8500,
    preparation_days: 3,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
  {
    id: '6',
    category_id: '6',
    name: 'Torta de Zanahoria',
    slug: 'torta-zanahoria',
    description: 'Bizcocho especiado con zanahoria, nueces y frosting de queso crema',
    short_description: 'Especiada con nueces y queso crema',
    base_price: 170000,
    min_portions: 15,
    max_portions: 70,
    price_per_portion: 7500,
    preparation_days: 3,
    is_customizable: true,
    is_active: true,
    is_featured: true,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  },
]

export function FeaturedProducts({ products = mockProducts }: FeaturedProductsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.3 })

  // Calcular cuántas tarjetas mostrar según el viewport
  const getItemsPerView = () => {
    if (typeof window === 'undefined') return 3
    if (window.innerWidth < 768) return 1
    if (window.innerWidth < 1024) return 2
    return 3
  }

  const [itemsPerView, setItemsPerView] = useState(3)

  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView())
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const maxIndex = Math.max(0, products.length - itemsPerView)
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < maxIndex

  const animateSlide = (index: number) => {
    if (!carouselRef.current) return

    const itemWidth = carouselRef.current.querySelector('[data-carousel-item]')?.clientWidth || 0
    const gap = 24
    const offset = -(index * (itemWidth + gap))

    gsap.to(carouselRef.current, {
      x: offset,
      duration: 0.8,
      ease: 'power3.out',
    })
  }

  const handlePrev = () => {
    if (!canGoPrev) return
    const newIndex = currentIndex - 1
    setCurrentIndex(newIndex)
    animateSlide(newIndex)
  }

  const handleNext = () => {
    if (!canGoNext) return
    const newIndex = currentIndex + 1
    setCurrentIndex(newIndex)
    animateSlide(newIndex)
  }

  // Animate cards on scroll
  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      const cards = sectionRef.current?.querySelectorAll('[data-carousel-item]')
      cards?.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 50, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            delay: i * 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none none',
            },
          }
        )
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const totalPages = maxIndex + 1
  const indicators = Array.from({ length: totalPages }, (_, i) => i)

  return (
    <section ref={sectionRef} id="productos" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`text-center mb-14 lg:mb-16 transition-all duration-1000 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary font-semibold rounded-full text-sm mb-4">
            Nuestros Sabores
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-dark mb-6">
            Sabores que <span className="text-primary">Enamoran</span>
          </h2>
          <p className="text-xl text-dark-light max-w-2xl mx-auto">
            Cada sabor cuenta una historia, cada bocado es una celebración
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative mb-12">
          {/* Navigation Buttons */}
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className={`hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-20 w-14 h-14 rounded-full bg-white items-center justify-center transition-all duration-300 ${
              canGoPrev
                ? 'opacity-100 hover:bg-primary hover:text-white shadow-lg hover:shadow-xl hover:scale-110'
                : 'opacity-0 pointer-events-none'
            }`}
            aria-label="Anterior"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-20 w-14 h-14 rounded-full bg-white items-center justify-center transition-all duration-300 ${
              canGoNext
                ? 'opacity-100 hover:bg-primary hover:text-white shadow-lg hover:shadow-xl hover:scale-110'
                : 'opacity-0 pointer-events-none'
            }`}
            aria-label="Siguiente"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Carousel Track */}
          <div className="overflow-hidden">
            <div
              ref={carouselRef}
              className="flex gap-6"
              style={{ width: `${(products.length * 100) / itemsPerView}%` }}
            >
              {products.map((product, index) => (
                <div
                  key={product.id}
                  data-carousel-item
                  className="flex-shrink-0"
                  style={{ width: `${100 / products.length}%` }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <Link href={`/catalogo/${product.slug}`} className="block group">
                    <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-transparent hover:border-primary/10">
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-secondary to-primary/5">
                        {/* Placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center transform group-hover:scale-110 transition-transform duration-500">
                            <div className="text-6xl mb-2 filter group-hover:drop-shadow-lg transition-all">🎂</div>
                          </div>
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

                        {/* Quick view button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                          <span className="px-6 py-2.5 bg-white text-dark font-semibold rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            Ver detalles
                          </span>
                        </div>

                        {/* Featured Badge */}
                        {product.is_featured && (
                          <div className="absolute top-4 left-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-primary font-semibold rounded-full text-xs shadow-md">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Destacado
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="font-display text-xl font-bold text-dark mb-2 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>

                        {product.short_description && (
                          <p className="text-dark-light text-sm mb-4 line-clamp-2">
                            {product.short_description}
                          </p>
                        )}

                        {/* Price & Details */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <span className="text-2xl font-bold text-accent font-display">
                              {formatCurrency(product.base_price)}
                            </span>
                            <span className="text-xs text-dark-light ml-1">desde</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-dark-light bg-secondary/50 px-2.5 py-1 rounded-full">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{product.min_portions}-{product.max_portions}</span>
                          </div>
                        </div>

                        {/* CTA Arrow */}
                        <div className="flex items-center gap-2 text-primary font-semibold text-sm pt-4 border-t border-border/50">
                          <span className="group-hover:mr-2 transition-all">Ver más</span>
                          <svg
                            className="w-4 h-4 transform group-hover:translate-x-2 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Indicators */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {indicators.map((index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index)
                    animateSlide(index)
                  }}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-10 bg-primary'
                      : 'w-2.5 bg-dark/20 hover:bg-dark/40'
                  }`}
                  aria-label={`Ir a página ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/catalogo" className="group inline-block">
            <Button size="lg" className="shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <span>Explorar Todos los Sabores</span>
              <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
