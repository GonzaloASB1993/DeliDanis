'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '@/components/ui'

gsap.registerPlugin(ScrollTrigger)

export function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return

    const ctx = gsap.context(() => {
      const content = contentRef.current
      if (!content) return

      // Orchestrated entrance
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      })

      tl.fromTo(
        content.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Rich gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#C4746C] via-primary to-[#B06B64]" />

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-white/[0.08] rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div
          ref={contentRef}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/10 backdrop-blur-sm rounded-full text-white/90 font-medium text-sm mb-8 border border-white/15">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            Reservas Disponibles — Cupos Limitados
          </div>

          {/* Heading */}
          <h2 className="font-display text-3xl md:text-4xl lg:text-[3.25rem] font-bold text-white mb-6 leading-[1.1]">
            Listo para Hacer tu Evento{' '}
            <span className="text-accent-light">Inolvidable?</span>
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-white/85 mb-10 max-w-2xl mx-auto leading-relaxed">
            Reserva tu fecha hoy y dejanos crear la torta perfecta para tu celebracion.
            Cada pedido es unico, igual que tu momento especial.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/agendar" className="group">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-primary hover:bg-white/95 shadow-xl hover:shadow-2xl transition-all duration-300 px-9 py-5 text-base font-bold"
              >
                <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Reservar mi Fecha</span>
                <svg className="w-5 h-5 ml-2.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            <Link href="/cotizar" className="group">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto border-2 border-white/25 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-300 px-9 py-5 text-base font-bold backdrop-blur-sm"
              >
                <span>Solicitar Cotizacion</span>
                <svg className="w-5 h-5 ml-2.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/80 border-t border-white/10 pt-8">
            {[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Ingredientes Premium' },
              { icon: 'M5 13l4 4L19 7', label: 'Entrega Garantizada' },
              { icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', label: '500+ Eventos Exitosos' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <svg className="w-5 h-5 text-accent-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
