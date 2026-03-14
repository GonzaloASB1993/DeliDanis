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
  accentColor: string
  icon: string
}

const services: Service[] = [
  {
    title: 'Tortas Personalizadas',
    description: 'Disenos unicos hechos a medida para tu celebracion especial. Cada torta es una obra de arte.',
    features: [
      'Disenos 100% personalizados',
      'Ingredientes premium',
      'Rellenos generosos',
      'Decoracion artesanal',
    ],
    image: '/toa-heftiba-aVQBP7mxddw-unsplash.jpg',
    href: '/catalogo',
    ctaText: 'Ver Catalogo',
    accentColor: 'primary',
    icon: 'M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.701 2.701 0 001 15.546M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z',
  },
  {
    title: 'Cocteles para Eventos',
    description: 'Delicias dulces y saladas perfectas para recepciones, cocktails y celebraciones especiales.',
    features: [
      'Mini pies y postres',
      'Selladitos variados',
      'Empanadas cocteleras',
      'Canapes gourmet',
    ],
    image: '/images/service-cocteleria.jpg',
    href: '/catalogo/cocteleria',
    ctaText: 'Ver Cocteles',
    accentColor: 'accent',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Pasteleria Artesanal',
    description: 'Delicias artesanales para endulzar cada momento del dia con sabores que enamoran.',
    features: [
      'Pie de limon',
      'Tartas variadas',
      'Galletas gourmet',
      'Rollitos de canela',
    ],
    image: '/kaouther-djouada-xMsrnA0C4sg-unsplash.jpg',
    href: '/catalogo/pasteleria',
    ctaText: 'Ver Pasteleria',
    accentColor: 'success',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  },
]

export function ServicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      // Header animation
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

      // Cards stagger with slight rotation for personality
      const cards = cardsRef.current?.querySelectorAll('[data-service-card]')
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 82%',
              toggleActions: 'play none none none',
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="servicios"
      className="py-20 lg:py-28 bg-secondary/40 overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-14 lg:mb-16">
          <span className="inline-flex items-center gap-2 px-5 py-2 bg-primary/8 text-primary font-semibold rounded-full text-sm mb-5">
            Nuestros Servicios
          </span>

          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-dark mb-4 leading-[1.1]">
            Tres Formas de{' '}
            <span className="text-primary">Celebrar Contigo</span>
          </h2>

          <p className="text-dark-light max-w-2xl mx-auto text-lg leading-relaxed">
            Desde tortas que roban suspiros hasta delicias que sorprenden paladares. Cada servicio diseado para hacer tu evento inolvidable.
          </p>
        </div>

        {/* Services Grid */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              data-service-card
              className="group"
            >
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-border/20 hover:border-primary/15 h-full flex flex-col">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-dark/20 to-transparent" />

                  {/* Icon badge */}
                  <div className="absolute top-4 left-4 z-20">
                    <div className="w-11 h-11 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={service.icon} />
                      </svg>
                    </div>
                  </div>

                  {/* Title over image */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                    <h3 className="font-display text-2xl font-bold text-white drop-shadow-md">
                      {service.title}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 lg:p-6 flex-1 flex flex-col">
                  <p className="text-dark-light mb-5 text-sm leading-relaxed">
                    {service.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {service.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2.5"
                      >
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
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
                      className="w-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-400"
                    >
                      <span>{service.ctaText}</span>
                      <svg
                        className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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
