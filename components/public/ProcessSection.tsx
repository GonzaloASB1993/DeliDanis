'use client'

import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

gsap.registerPlugin(ScrollTrigger)

const steps = [
  {
    number: 1,
    title: 'Elige tu Torta',
    description:
      'Explora nuestro catálogo o solicita un diseño personalizado según tus preferencias.',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    color: 'from-primary to-primary-light',
  },
  {
    number: 2,
    title: 'Personaliza',
    description:
      'Selecciona sabores, tamaño, decoración y cualquier detalle especial que desees.',
    icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
    color: 'from-accent to-accent-light',
  },
  {
    number: 3,
    title: 'Agenda',
    description:
      'Selecciona la fecha de entrega y confirma tu pedido con pago seguro.',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: 'from-info to-info/70',
  },
  {
    number: 4,
    title: 'Disfruta',
    description:
      'Recibe tu torta en la fecha acordada y sorprende a todos.',
    icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'from-success to-success-dark',
  },
]

export function ProcessSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.3 })

  useEffect(() => {
    if (!stepsRef.current || !lineRef.current) return

    const ctx = gsap.context(() => {
      // Animate the connecting line
      gsap.fromTo(
        lineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: stepsRef.current,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
        }
      )

      // Animate each step card
      const cards = stepsRef.current?.querySelectorAll('[data-step-card]')
      cards?.forEach((card, i) => {
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 60,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            delay: i * 0.15,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )

        // Animate the icon circle
        const iconCircle = card.querySelector('[data-icon-circle]')
        gsap.fromTo(
          iconCircle,
          { scale: 0, rotation: -180 },
          {
            scale: 1,
            rotation: 0,
            duration: 0.6,
            delay: i * 0.15 + 0.3,
            ease: 'back.out(2)',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )

        // Animate the number badge
        const numberBadge = card.querySelector('[data-number-badge]')
        gsap.fromTo(
          numberBadge,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.4,
            delay: i * 0.15 + 0.5,
            ease: 'elastic.out(1, 0.5)',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-gradient-to-b from-white via-secondary/30 to-white overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`text-center mb-16 lg:mb-20 transition-all duration-1000 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary font-semibold rounded-full text-sm mb-4">
            Proceso Simple
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-dark mb-6">
            ¿Cómo <span className="text-primary">Funciona?</span>
          </h2>
          <p className="text-xl text-dark-light max-w-2xl mx-auto">
            Hacer tu pedido es fácil y rápido. Sigue estos simples pasos
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div
            ref={lineRef}
            className="hidden lg:block absolute top-[60px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary via-accent to-success origin-left"
            style={{ transformOrigin: 'left center' }}
          />

          {/* Steps Grid */}
          <div ref={stepsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <div
                key={step.number}
                data-step-card
                className="relative group"
              >
                {/* Card */}
                <div className="relative bg-white rounded-3xl p-8 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-transparent hover:border-primary/10">
                  {/* Icon Circle */}
                  <div className="relative mx-auto w-[120px] h-[120px] mb-6">
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 group-hover:border-primary/40 group-hover:animate-spin-slow transition-colors" style={{ animationDuration: '15s' }} />

                    {/* Background gradient circle */}
                    <div
                      data-icon-circle
                      className={`absolute inset-3 rounded-full bg-gradient-to-br ${step.color} shadow-lg group-hover:shadow-xl transition-shadow`}
                    >
                      {/* Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="w-10 h-10 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                        </svg>
                      </div>
                    </div>

                    {/* Number Badge */}
                    <div
                      data-number-badge
                      className="absolute -top-1 -right-1 w-10 h-10 bg-dark text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform"
                    >
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h3 className="font-display text-2xl font-bold text-dark mb-3 group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-dark-light leading-relaxed">{step.description}</p>
                  </div>

                  {/* Arrow to next (Desktop) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-[60px] -right-6 z-10 transform translate-x-1/2">
                      <div className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Arrow */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
