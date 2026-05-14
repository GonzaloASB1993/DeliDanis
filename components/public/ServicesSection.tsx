'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '@/components/ui'

gsap.registerPlugin(ScrollTrigger)

interface Service {
  title: string
  description: string
  features: string[]
  image: string
  href: string
  ctaText: string
  icon: string
}

const services: Service[] = [
  {
    title: 'Tortas Personalizadas',
    description: 'Diseños únicos hechos a medida para tu celebración especial. Cada torta es una obra de arte.',
    features: [
      'Diseños 100% personalizados',
      'Ingredientes premium',
      'Rellenos generosos',
      'Decoración artesanal',
    ],
    image: '/images/service-tortas.jpg',
    href: '/catalogo',
    ctaText: 'Ver catálogo',
    icon: 'M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.701 2.701 0 001 15.546M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z',
  },
  {
    title: 'Cócteles para Eventos',
    description: 'Delicias dulces y saladas perfectas para recepciones, cocktails y celebraciones especiales.',
    features: [
      'Mini pies y postres',
      'Selladitos variados',
      'Empanadas cocteleras',
      'Canapes gourmet',
    ],
    image: '/images/service-cocteleria.jpg',
    href: '/catalogo/cocteleria',
    ctaText: 'Ver cócteles',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Pastelería Artesanal',
    description: 'Delicias artesanales para endulzar cada momento del día con sabores que enamoran.',
    features: [
      'Pie de limón',
      'Tartas variadas',
      'Galletas gourmet',
      'Rollitos de canela',
    ],
    image: '/images/service-pasteleria.jpg',
    href: '/catalogo/pasteleria',
    ctaText: 'Ver pastelería',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  },
]

export function ServicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      // Header text animation - stagger the h2 and subtitle
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // Decorative line expands from left
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1,
            ease: 'power3.inOut',
            scrollTrigger: {
              trigger: lineRef.current,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // Cards - staggered entrance
      if (cardsRef.current) {
        const cards = cardsRef.current.querySelectorAll('[data-service-card]')
        if (cards.length > 0) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.12,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: cardsRef.current,
                start: 'top 82%',
                toggleActions: 'play none none none',
              },
            }
          )
        }
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="servicios"
      className="section-padding bg-secondary/40 overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Split Header: h2 left, subtitle right */}
        <div ref={headerRef} className="mb-10 lg:mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 lg:gap-12">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-dark leading-[1.1] lg:max-w-lg">
              Tres formas de{' '}
              <span className="text-primary italic font-accent">celebrar contigo</span>
            </h2>

            <p className="text-dark-light text-lg leading-relaxed lg:max-w-md lg:text-right">
              Desde tortas que roban suspiros hasta delicias que sorprenden
              paladares. Cada servicio disenado para hacer tu evento
              inolvidable.
            </p>
          </div>

          {/* Decorative expanding line */}
          <div
            ref={lineRef}
            className="mt-5 lg:mt-6 h-px bg-gradient-to-r from-primary via-primary/40 to-transparent origin-left"
          />
        </div>

        {/* 3 Equal Columns */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              data-service-card
              className="group"
            >
              <div className="card-tile card-tile-hover">
                {/* Image — clean, no overlays competing with content */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                  />
                </div>

                {/* Content — title here, paired with a small icon, so the hierarchy reads cleanly */}
                <div className="p-5 lg:p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.75}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={service.icon} />
                      </svg>
                    </span>
                    <h3 className="font-display text-xl font-bold text-dark leading-tight">
                      {service.title}
                    </h3>
                  </div>

                  <p className="text-dark-light mb-4 text-sm leading-relaxed">
                    {service.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-5 flex-1">
                    {service.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2"
                      >
                        <div className="flex-shrink-0 w-[18px] h-[18px] rounded-full bg-primary/10 flex items-center justify-center">
                          <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="text-dark text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link href={service.href} className="block mt-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300"
                    >
                      <span>{service.ctaText}</span>
                      <svg
                        className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
