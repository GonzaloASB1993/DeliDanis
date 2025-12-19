'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { Button } from '@/components/ui'

gsap.registerPlugin(ScrollTrigger)

interface Service {
  title: string
  description: string
  features: string[]
  image: string
  href: string
  ctaText: string
  gradient: string
  icon: string
}

const services: Service[] = [
  {
    title: 'Tortas Personalizadas',
    description: 'Diseños únicos hechos a medida para tu celebración especial.',
    features: [
      'Diseños 100% personalizados',
      'Ingredientes premium',
      'Rellenos generosos',
      'Decoración artesanal',
    ],
    image: '/images/service-tortas.jpg',
    href: '/catalogo',
    ctaText: 'Ver Catálogo',
    gradient: 'from-primary/80 to-primary-light/60',
    icon: 'M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z',
  },
  {
    title: 'Cocteles para Eventos',
    description: 'Delicias dulces y saladas perfectas para tu celebración.',
    features: [
      'Mini pies y postres',
      'Selladitos variados',
      'Empanadas cocteleras',
      'Canapés gourmet',
    ],
    image: '/images/service-cocteleria.jpg',
    href: '/catalogo/cocteleria',
    ctaText: 'Ver Cocteles',
    gradient: 'from-accent/80 to-accent-light/60',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Pastelería',
    description: 'Delicias artesanales para endulzar cada momento del día.',
    features: [
      'Pie de limón',
      'Tartas variadas',
      'Galletas gourmet',
      'Rollitos de canela',
    ],
    image: '/images/service-pasteleria.jpg',
    href: '/catalogo/pasteleria',
    ctaText: 'Ver Pastelería',
    gradient: 'from-success/80 to-success-dark/60',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  },
]

export function ServicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.3 })

  useEffect(() => {
    if (!sectionRef.current || !cardsRef.current) return

    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.querySelectorAll('[data-service-card]')

      cards?.forEach((card, i) => {
        // Card entrance animation
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 80,
            rotateY: -15,
          },
          {
            opacity: 1,
            y: 0,
            rotateY: 0,
            duration: 0.9,
            delay: i * 0.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )

        // Image scale animation on scroll
        const image = card.querySelector('[data-service-image]')
        gsap.fromTo(
          image,
          { scale: 1.3 },
          {
            scale: 1,
            duration: 1.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        )

        // Features stagger animation
        const features = card.querySelectorAll('[data-feature]')
        gsap.fromTo(
          features,
          { opacity: 0, x: -20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.1,
            delay: i * 0.2 + 0.4,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        )
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="servicios"
      className="py-12 lg:py-16 bg-gradient-to-b from-secondary/50 via-white to-secondary/30 overflow-hidden"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`text-center mb-8 lg:mb-12 transition-all duration-1000 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary font-semibold rounded-full text-sm mb-4">
            Nuestros Servicios
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-dark mb-6">
            Tres Formas de{' '}
            <span className="text-primary">Celebrar Contigo</span>
          </h2>
          <p className="text-xl text-dark-light max-w-3xl mx-auto">
            Desde tortas que roban suspiros hasta delicias que sorprenden paladares
          </p>
        </div>

        {/* Services Grid */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10"
        >
          {services.map((service, index) => (
            <div
              key={service.title}
              data-service-card
              className="group relative"
              style={{ perspective: '1000px' }}
            >
              <div className="relative bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 border border-transparent hover:border-primary/10">
                {/* Image Container */}
                <div className="relative h-48 lg:h-56 overflow-hidden">
                  {/* Background gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${service.gradient} opacity-60 z-10 group-hover:opacity-40 transition-opacity duration-500`} />

                  {/* Pattern overlay */}
                  <div className="absolute inset-0 z-10 opacity-10">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
                      }}
                    />
                  </div>

                  {/* Image placeholder */}
                  <div
                    data-service-image
                    className="absolute inset-0 bg-gradient-to-br from-secondary to-primary/10 flex items-center justify-center"
                  >
                    <div className="text-center text-white z-20">
                      <div className="w-20 h-20 mx-auto mb-3 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <svg
                          className="w-10 h-10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d={service.icon} />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <h3 className="font-display text-3xl font-bold text-white drop-shadow-lg">
                      {service.title}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 lg:p-6">
                  <p className="text-dark-light mb-4 leading-relaxed text-sm">
                    {service.description}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2 mb-5">
                    {service.features.map((feature, i) => (
                      <li
                        key={feature}
                        data-feature
                        className="flex items-center gap-3 group/feature"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover/feature:bg-primary group-hover/feature:scale-110 transition-all duration-300">
                          <svg
                            className="w-3.5 h-3.5 text-primary group-hover/feature:text-white transition-colors"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="text-dark text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link href={service.href} className="block">
                    <Button
                      variant="secondary"
                      className="w-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500 hover:scale-[1.02]"
                    >
                      <span>{service.ctaText}</span>
                      <svg
                        className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </Button>
                  </Link>
                </div>

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full transform group-hover:scale-150 transition-transform duration-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
