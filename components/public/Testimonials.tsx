'use client'

import { useRef } from 'react'
import { Card } from '@/components/ui'
import { useStaggerChildren } from '@/hooks/useAnimations'

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
]

export function Testimonials() {
  const gridRef = useRef<HTMLDivElement>(null)
  useStaggerChildren(gridRef)

  return (
    <section className="py-16 lg:py-20 bg-secondary">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-dark mb-4">
            Lo Que Dicen Nuestros{' '}
            <span className="text-primary">Clientes</span>
          </h2>
          <p className="text-xl text-dark-light max-w-2xl mx-auto">
            La satisfacción de nuestros clientes es nuestra mejor carta de
            presentación
          </p>
        </div>

        {/* Testimonials Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} variant="white" className="h-full">
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-accent"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Comment */}
              <p className="text-dark-light mb-6 italic">
                "{testimonial.comment}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-dark">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-dark-light">
                    {testimonial.event}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
