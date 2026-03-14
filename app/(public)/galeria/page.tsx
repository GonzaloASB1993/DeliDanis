'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CTASection } from '@/components/public/CTASection'
import { getGalleryImages, type GalleryImage as DBGalleryImage } from '@/lib/supabase/gallery-queries'

gsap.registerPlugin(ScrollTrigger)

type Category = 'todos' | 'tortas' | 'pasteleria' | 'cocteleria'

interface GalleryImage {
  src: string
  alt: string
  category: Category
}

const fallbackImages: GalleryImage[] = [
  { src: '/images/hero-1.jpg', alt: 'Torta decorada para evento especial', category: 'tortas' },
  { src: '/kaouther-djouada-xMsrnA0C4sg-unsplash.jpg', alt: 'Pasteleria artesanal variada', category: 'pasteleria' },
  { src: '/images/hero-2.jpg', alt: 'Torta elegante de bodas', category: 'tortas' },
  { src: '/images/service-cocteleria.jpg', alt: 'Cocteleria gourmet para eventos', category: 'cocteleria' },
  { src: '/Delidanis.jpg', alt: 'Creacion especial DeliDanis', category: 'tortas' },
  { src: '/images/hero-3.jpg', alt: 'Torta personalizada con decoracion floral', category: 'tortas' },
  { src: '/images/service-pasteleria.jpg', alt: 'Seleccion de pasteleria fina', category: 'pasteleria' },
  { src: '/toa-heftiba-aVQBP7mxddw-unsplash.jpg', alt: 'Torta artesanal premium', category: 'tortas' },
  { src: '/images/hero-4.jpg', alt: 'Torta tematica para celebracion', category: 'tortas' },
  { src: '/images/service-tortas.jpg', alt: 'Torta clasica de cumpleanos', category: 'tortas' },
]

function mapDBImages(dbImages: DBGalleryImage[]): GalleryImage[] {
  return dbImages.map(img => ({
    src: img.url,
    alt: img.alt_text || img.title || 'Galeria DeliDanis',
    category: img.category as Category,
  }))
}

const categories: { key: Category; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'tortas', label: 'Tortas' },
  { key: 'pasteleria', label: 'Pasteleria' },
  { key: 'cocteleria', label: 'Cocteleria' },
]

export default function GaleriaPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('todos')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(fallbackImages)
  const [loading, setLoading] = useState(true)
  const gridRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Load images from DB
  useEffect(() => {
    getGalleryImages()
      .then(data => {
        if (data.length > 0) {
          setGalleryImages(mapDBImages(data))
        }
        // If empty, keep fallback images
      })
      .catch(() => {
        // On error, keep fallback images
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredImages = activeCategory === 'todos'
    ? galleryImages
    : galleryImages.filter((img) => img.category === activeCategory)

  const lightboxOpen = lightboxIndex !== null

  // GSAP stagger animation on grid items
  useEffect(() => {
    if (!gridRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        gridRef.current!.children,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [activeCategory])

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => prev !== null ? (prev + 1) % filteredImages.length : null)
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => prev !== null ? (prev - 1 + filteredImages.length) % filteredImages.length : null)
    },
    [lightboxOpen, filteredImages.length]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxOpen])

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-secondary to-accent/10 py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary/30 rounded-full" />
          <div className="absolute top-20 right-20 w-32 h-32 border-2 border-accent/30 rounded-full" />
          <div className="absolute bottom-20 left-1/4 w-24 h-24 border-2 border-primary/30 rounded-full" />
          <div className="absolute bottom-10 right-1/3 w-16 h-16 border-2 border-accent/30 rounded-full" />
        </div>

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-primary font-medium mb-6 shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Nuestro trabajo
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-dark mb-6">
              Nuestra <span className="text-primary">Galeria</span>
            </h1>
            <p className="text-lg md:text-xl text-dark-light leading-relaxed max-w-2xl mx-auto">
              Cada creacion cuenta una historia. Explora nuestras tortas, pasteleria y cocteleria que han sido parte de momentos inolvidables.
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section ref={sectionRef} className="section-padding">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-6 py-2.5 rounded-full font-body text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat.key
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-secondary text-dark-light hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Masonry Grid */}
          <div
            ref={gridRef}
            className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
          >
            {filteredImages.map((image, index) => (
              <div
                key={image.src}
                className="break-inside-avoid group cursor-pointer hover-lift"
                onClick={() => setLightboxIndex(index)}
              >
                <div className="relative overflow-hidden rounded-2xl image-shine">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={600}
                    height={index % 3 === 0 ? 800 : index % 3 === 1 ? 600 : 700}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white text-sm font-medium">{image.alt}</p>
                      <p className="text-white/70 text-xs mt-1 capitalize">{image.category}</p>
                    </div>
                  </div>
                  {/* Zoom icon */}
                  <div className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-5 h-5 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-20">
              <p className="text-dark-light text-lg">No hay imagenes en esta categoria aun.</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-dark/90 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
            onClick={() => setLightboxIndex(null)}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous button */}
          <button
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex((prev) => prev !== null ? (prev - 1 + filteredImages.length) % filteredImages.length : null)
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next button */}
          <button
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex((prev) => prev !== null ? (prev + 1) % filteredImages.length : null)
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Image */}
          <div
            className="relative max-w-5xl max-h-[85vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={filteredImages[lightboxIndex!].src}
              alt={filteredImages[lightboxIndex!].alt}
              width={1200}
              height={900}
              className="max-h-[85vh] w-auto h-auto object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark/70 to-transparent rounded-b-lg">
              <p className="text-white text-sm font-medium">{filteredImages[lightboxIndex!].alt}</p>
              <p className="text-white/60 text-xs mt-1">
                {lightboxIndex! + 1} / {filteredImages.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <CTASection />
    </>
  )
}
