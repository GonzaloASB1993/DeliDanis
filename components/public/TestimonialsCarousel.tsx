'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { gsap } from 'gsap'

interface Testimonial {
  id: string
  name: string
  event: string
  comment: string
  rating: number
  image?: string
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'María González',
    event: 'Boda',
    comment:
      'La torta de nuestra boda fue espectacular. Todos los invitados quedaron encantados con el sabor y la presentación. ¡Superó nuestras expectativas!',
    rating: 5,
  },
  {
    id: '2',
    name: 'Carlos Ramírez',
    event: 'Evento Corporativo',
    comment:
      'Excelente servicio y atención al detalle. La torta con el logo de nuestra empresa quedó perfecta. Definitivamente volveremos a ordenar.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Ana Martínez',
    event: 'Quinceañera',
    comment:
      'Mi hija quedó feliz con su torta de quinceañera. El diseño personalizado fue exactamente lo que imaginamos. Totalmente recomendados.',
    rating: 5,
  },
  {
    id: '4',
    name: 'Luis Hernández',
    event: 'Cumpleaños',
    comment:
      'La atención personalizada y el resultado final fueron increíbles. La torta no solo se veía hermosa, sino que el sabor era excepcional.',
    rating: 5,
  },
  {
    id: '5',
    name: 'Patricia Silva',
    event: 'Baby Shower',
    comment:
      'Quedé maravillada con el nivel de detalle y creatividad. La torta fue el centro de atención de la fiesta. ¡Muchas gracias!',
    rating: 5,
  },
]

export function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.3 })

  const totalSlides = testimonials.length

  const goToSlide = useCallback((index: number) => {
    if (!trackRef.current) return

    // Ensure index is within bounds
    const newIndex = Math.max(0, Math.min(index, totalSlides - 1))
    setCurrentIndex(newIndex)

    gsap.to(trackRef.current, {
      x: `-${newIndex * 100}%`,
      duration: 0.6,
      ease: 'power2.out',
    })
  }, [totalSlides])

  // Auto-play functionality
  useEffect(() => {
    if (isPaused || !isVisible) return

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % totalSlides
      goToSlide(nextIndex)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused, isVisible, currentIndex, totalSlides, goToSlide])

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
      className="py-12 lg:py-16 bg-gradient-to-br from-white via-secondary to-primary/5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div
          className={`text-center mb-10 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary font-semibold rounded-full text-sm mb-4">
            Testimonios
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-dark mb-4">
            Lo Que Dicen Nuestros{' '}
            <span className="text-primary">Clientes</span>
          </h2>
          <p className="text-lg text-dark-light max-w-2xl mx-auto">
            La satisfacción de nuestros clientes es nuestra mejor carta de presentación
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-3xl mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 lg:-translate-x-14 z-10 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white border border-border flex items-center justify-center transition-all duration-300 hover:bg-primary hover:border-primary hover:text-white shadow-md hover:shadow-lg"
            aria-label="Testimonio anterior"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 lg:translate-x-14 z-10 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white border border-border flex items-center justify-center transition-all duration-300 hover:bg-primary hover:border-primary hover:text-white shadow-md hover:shadow-lg"
            aria-label="Siguiente testimonio"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Carousel Track */}
          <div className="overflow-hidden rounded-2xl">
            <div
              ref={trackRef}
              className="flex transition-transform"
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="w-full flex-shrink-0 px-2"
                >
                  <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-10 relative">
                    {/* Decorative Quote */}
                    <div className="absolute top-4 right-4 text-primary/10">
                      <svg className="w-12 h-12 lg:w-16 lg:h-16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                    </div>

                    {/* Rating */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Comment */}
                    <p className="text-dark-light text-base lg:text-lg mb-6 leading-relaxed">
                      "{testimonial.comment}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-4 pt-4 border-t border-border">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-dark">{testimonial.name}</div>
                        <div className="text-sm text-dark-light">{testimonial.event}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-dark/20 hover:bg-dark/40'
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
