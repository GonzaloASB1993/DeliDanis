'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '@/components/ui'

gsap.registerPlugin(ScrollTrigger)

const trustIndicators = [
  {
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    label: 'Ingredientes Premium',
  },
  {
    icon: 'M5 13l4 4L19 7',
    label: 'Entrega Garantizada',
  },
  {
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    label: 'Atencion Personalizada',
  },
  {
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    label: 'Consulta Gratuita',
  },
]

export function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const trustRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      })

      // Left content: slide in from left
      if (leftRef.current) {
        tl.fromTo(
          leftRef.current.children,
          { opacity: 0, x: -40 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out',
          }
        )
      }

      // Vertical divider: scale in
      if (dividerRef.current) {
        tl.fromTo(
          dividerRef.current,
          { scaleY: 0, opacity: 0 },
          {
            scaleY: 1,
            opacity: 1,
            duration: 0.6,
            ease: 'power3.out',
          },
          '-=0.5'
        )
      }

      // Right buttons: slide in from right, staggered
      if (rightRef.current) {
        tl.fromTo(
          rightRef.current.children,
          { opacity: 0, x: 40 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
          },
          '-=0.4'
        )
      }

      // Trust indicators: stagger from bottom
      if (trustRef.current) {
        tl.fromTo(
          trustRef.current.children,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: 'power3.out',
          },
          '-=0.3'
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-16 lg:py-24 overflow-hidden"
    >
      {/* Gradient background with diagonal split */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#C4746C] via-primary to-[#B06B64]" />
      <div className="absolute inset-0 bg-gradient-to-tr from-[#B06B64]/60 via-transparent to-primary/40" />

      {/* Decorative large typography in background */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <span
          className="font-display text-[18rem] md:text-[26rem] lg:text-[34rem] font-bold text-white/[0.035] leading-none whitespace-nowrap -rotate-12"
        >
          DeliDanis
        </span>
      </div>

      {/* Top glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[200px] bg-white/[0.06] rounded-full blur-[100px] pointer-events-none" />
      {/* Bottom glow */}
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[160px] bg-[#B06B64]/30 rounded-full blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Split layout: left content + right CTA */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16 xl:gap-24 max-w-6xl mx-auto">
          {/* Left side: Heading and description, left-aligned */}
          <div ref={leftRef} className="flex-1 mb-10 lg:mb-0">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/10 backdrop-blur-sm rounded-full text-white/90 font-medium text-sm mb-8 border border-white/15">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              Reservas Disponibles — Cupos Limitados
            </div>

            {/* Heading */}
            <h2 className="font-display text-3xl md:text-4xl lg:text-[3.25rem] font-bold text-white mb-6 leading-[1.1]">
              Listo para Hacer tu Evento{' '}
              <span className="text-accent-light">Inolvidable?</span>
            </h2>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/85 leading-relaxed max-w-xl">
              Reserva tu fecha hoy y dejanos crear la torta perfecta para tu celebracion.
              Cada pedido es unico, igual que tu momento especial.
            </p>
          </div>

          {/* Vertical divider — visible only on desktop */}
          <div
            ref={dividerRef}
            className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-white/25 to-transparent origin-top"
            aria-hidden="true"
          />

          {/* Right side: CTA buttons stacked vertically */}
          <div
            ref={rightRef}
            className="flex flex-col gap-4 lg:gap-5 lg:min-w-[280px] xl:min-w-[320px]"
          >
            {/* Decorative accent line above buttons on mobile */}
            <div className="lg:hidden w-16 h-px bg-white/25 mb-2" aria-hidden="true" />

            <Link href="/agendar" className="group">
              <Button
                size="lg"
                className="w-full bg-white text-primary hover:bg-white/95 shadow-xl hover:shadow-2xl transition-all duration-300 px-9 py-5 text-base font-bold"
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
                className="w-full border-2 border-white/25 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-300 px-9 py-5 text-base font-bold backdrop-blur-sm"
              >
                <span>Solicitar Cotizacion</span>
                <svg className="w-5 h-5 ml-2.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>

            {/* Small reassurance text */}
            <p className="text-white/50 text-xs text-center mt-1 font-body">
              Sin compromiso. Respuesta en menos de 24h.
            </p>
          </div>
        </div>

        {/* Trust indicators — full width, separated by vertical dividers */}
        <div
          ref={trustRef}
          className="flex flex-wrap items-center justify-center gap-0 mt-16 pt-8 border-t border-white/10 max-w-4xl mx-auto"
        >
          {trustIndicators.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 px-6 lg:px-8 py-2"
              style={{
                borderRight:
                  i < trustIndicators.length - 1
                    ? '1px solid rgba(255, 255, 255, 0.15)'
                    : 'none',
              }}
            >
              <svg
                className="w-5 h-5 text-accent-light flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="text-sm font-medium text-white/80 whitespace-nowrap">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
