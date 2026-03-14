'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Testimonial {
  id: string
  name: string
  event: string
  comment: string
  rating: number
  initials: string
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Maria Gonzalez',
    event: 'Boda',
    comment:
      'La torta de nuestra boda fue espectacular. Todos los invitados quedaron encantados con el sabor y la presentacion. Supero nuestras expectativas!',
    rating: 5,
    initials: 'MG',
  },
  {
    id: '2',
    name: 'Carlos Ramirez',
    event: 'Evento Corporativo',
    comment:
      'Excelente servicio y atencion al detalle. La torta con el logo de nuestra empresa quedo perfecta. Definitivamente volveremos a ordenar.',
    rating: 5,
    initials: 'CR',
  },
  {
    id: '3',
    name: 'Ana Martinez',
    event: 'Quinceañera',
    comment:
      'Mi hija quedo feliz con su torta de quinceañera. El diseno personalizado fue exactamente lo que imaginamos. Totalmente recomendados.',
    rating: 5,
    initials: 'AM',
  },
  {
    id: '4',
    name: 'Luis Hernandez',
    event: 'Cumpleaños',
    comment:
      'La atencion personalizada y el resultado final fueron increibles. La torta no solo se veia hermosa, sino que el sabor era excepcional.',
    rating: 5,
    initials: 'LH',
  },
  {
    id: '5',
    name: 'Patricia Silva',
    event: 'Baby Shower',
    comment:
      'Quede maravillada con el nivel de detalle y creatividad. La torta fue el centro de atencion de la fiesta. Muchas gracias!',
    rating: 5,
    initials: 'PS',
  },
]

export function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  const totalSlides = testimonials.length

  // Intersection observer to track visibility
  useEffect(() => {
    if (!sectionRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2 }
    )

    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  // GSAP entrance
  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // Card reveal
      const cardContainer = sectionRef.current?.querySelector('[data-testimonial-container]')
      if (cardContainer) {
        gsap.fromTo(
          cardContainer,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardContainer,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const goToSlide = useCallback((index: number) => {
    if (!trackRef.current) return

    const newIndex = Math.max(0, Math.min(index, totalSlides - 1))
    setCurrentIndex(newIndex)

    gsap.to(trackRef.current, {
      x: `-${newIndex * 100}%`,
      duration: 0.7,
      ease: 'power2.inOut',
    })
  }, [totalSlides])

  // Auto-play
  useEffect(() => {
    if (isPaused || !isInView) return

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % totalSlides
      goToSlide(nextIndex)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused, isInView, currentIndex, totalSlides, goToSlide])

  const handlePrev = () => {
    const prevIndex = currentIndex === 0 ? totalSlides - 1 : currentIndex - 1
    goToSlide(prevIndex)
  }

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % totalSlides
    goToSlide(nextIndex)
  }

  return (
    <section
      id="testimonios"
      ref={sectionRef}
      className="py-20 lg:py-28 bg-gradient-to-b from-white via-secondary/20 to-white relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/[0.03] rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-accent/[0.03] rounded-full blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-14 lg:mb-16">
          <span className="inline-flex items-center gap-2 px-5 py-2 bg-primary/8 text-primary font-semibold rounded-full text-sm mb-5">
            Testimonios Reales
          </span>

          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-dark mb-4 leading-[1.1]">
            Lo Que Dicen Nuestros{' '}
            <span className="text-primary">Clientes</span>
          </h2>

          <p className="text-dark-light max-w-2xl mx-auto text-lg leading-relaxed">
            La satisfaccion de nuestros clientes es nuestra mejor carta de presentacion.
          </p>
        </div>

        {/* Carousel */}
        <div data-testimonial-container className="relative max-w-3xl mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 lg:-translate-x-16 z-10 w-11 h-11 rounded-full bg-white border border-border/50 flex items-center justify-center transition-all duration-300 hover:bg-primary hover:border-primary hover:text-white shadow-sm hover:shadow-md"
            aria-label="Testimonio anterior"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 lg:translate-x-16 z-10 w-11 h-11 rounded-full bg-white border border-border/50 flex items-center justify-center transition-all duration-300 hover:bg-primary hover:border-primary hover:text-white shadow-sm hover:shadow-md"
            aria-label="Siguiente testimonio"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Track */}
          <div className="overflow-hidden rounded-2xl">
            <div ref={trackRef} className="flex">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-2">
                  <div className="bg-white rounded-2xl shadow-sm border border-border/30 p-8 lg:p-10 relative">
                    {/* Decorative quote */}
                    <div className="absolute top-6 right-6 text-primary/8">
                      <svg className="w-14 h-14 lg:w-16 lg:h-16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                    </div>

                    {/* Rating */}
                    <div className="flex gap-1 mb-5">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Comment */}
                    <blockquote className="text-dark text-base lg:text-lg mb-8 leading-relaxed font-light italic">
                      &ldquo;{testimonial.comment}&rdquo;
                    </blockquote>

                    {/* Author */}
                    <div className="flex items-center gap-4 pt-6 border-t border-border/40">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white font-semibold text-sm">
                          {testimonial.initials}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-dark text-[15px]">{testimonial.name}</div>
                        <div className="text-sm text-dark-light">{testimonial.event}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2.5 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-400 ${
                  index === currentIndex
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-dark/15 hover:bg-dark/30'
                }`}
                aria-label={`Ir a testimonio ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
