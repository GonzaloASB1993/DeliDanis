'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '@/components/ui'

gsap.registerPlugin(ScrollTrigger)

const STATS = [
  { value: '150+', label: 'Eventos Celebrados' },
  { value: '5.0', label: 'Calificación' },
  { value: '3 años', label: 'De Experiencia' },
] as const

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const statsBorderRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  // ── Initial entrance animation ──
  useEffect(() => {
    const ctx = gsap.context(() => {
      const content = contentRef.current
      const badge = badgeRef.current
      const stats = statsRef.current
      const statsBorder = statsBorderRef.current
      const overlay = overlayRef.current
      const image = imageRef.current
      if (!content) return

      // Respect reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) {
        gsap.set(
          [badge, overlay, stats?.children, statsBorder].filter(Boolean),
          { opacity: 1, y: 0, scaleX: 1, scale: 1 }
        )
        const titles = content.querySelectorAll('[data-hero-title-inner]')
        gsap.set(titles, { y: '0%' })
        const subtitle = content.querySelector('[data-hero-subtitle]')
        if (subtitle) gsap.set(subtitle, { opacity: 1, y: 0 })
        const buttons = content.querySelector('[data-hero-buttons]')
        if (buttons) gsap.set(buttons, { opacity: 1, y: 0 })
        return
      }

      if (image) {
        gsap.set(image, { scale: 1.15 })
      }

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        delay: 0.2,
      })

      // 1. Image reveal — zoom out from 1.15 to 1
      if (image) {
        tl.to(image, {
          scale: 1,
          duration: 1.8,
          ease: 'power2.out',
        })
      }

      // 2. Overlay gradient fades in for text readability
      if (overlay) {
        tl.fromTo(
          overlay,
          { opacity: 0 },
          { opacity: 1, duration: 0.8 },
          '-=1.4'
        )
      }

      // 3. Badge
      if (badge) {
        tl.fromTo(
          badge,
          { opacity: 0, y: 16, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6 },
          '-=1.0'
        )
      }

      // 4. Title lines — clip-path mask reveal
      const titleWrappers = content.querySelectorAll('[data-hero-title-inner]')
      if (titleWrappers.length > 0) {
        tl.fromTo(
          titleWrappers,
          { y: '110%' },
          { y: '0%', duration: 0.9, stagger: 0.12, ease: 'power4.out' },
          '-=0.3'
        )
      }

      // 5. Subtitle
      const subtitle = content.querySelector('[data-hero-subtitle]')
      if (subtitle) {
        tl.fromTo(
          subtitle,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.5'
        )
      }

      // 6. CTA buttons
      const buttons = content.querySelector('[data-hero-buttons]')
      if (buttons) {
        tl.fromTo(
          buttons,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.3'
        )
      }

      // 7. Stats border line expand
      if (statsBorder) {
        tl.fromTo(
          statsBorder,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.7, ease: 'power3.inOut' },
          '-=0.2'
        )
      }

      // 8. Stats stagger
      if (stats) {
        tl.fromTo(
          stats.children,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
          '-=0.3'
        )
      }

      // ── Content parallax on scroll ──
      gsap.to(content, {
        y: 60,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={heroRef}
      className="relative h-[100svh] min-h-[600px] max-h-[1000px] overflow-hidden"
    >
      {/* ── Full-bleed background image ── */}
      <div
        ref={imageRef}
        className="absolute inset-0 will-change-transform"
      >
        <Image
          src="/images/hero-3.jpg"
          alt="Torta artesanal elegante de DeliDanis"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>

      {/* ── Gradient overlay for text readability ── */}
      <div
        ref={overlayRef}
        className="absolute inset-0 z-10"
      >
        {/* Left side: gradient for text readability — lighter so cake stays visible */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark/60 via-dark/25 to-transparent" />
        {/* Bottom: subtle gradient for stats */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark/40 via-transparent to-transparent" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-20 h-full flex flex-col justify-center">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-2xl">
            <div ref={contentRef}>
              {/* Badge */}
              <div
                ref={badgeRef}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-sm mb-6 border border-white/15"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-light/80 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-light" />
                </span>
                <span className="text-white/90 font-medium">Creadas con amor, celebradas con sabor</span>
              </div>

              {/* Title */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-5 leading-[1.05] tracking-tight">
                <span className="block overflow-hidden">
                  <span data-hero-title-inner className="block will-change-transform">
                    Tortas que Transforman
                  </span>
                </span>
                <span className="block overflow-hidden">
                  <span data-hero-title-inner className="block will-change-transform">
                    <span className="text-primary-light">tu Celebración</span>{' '}
                    en Arte
                  </span>
                </span>
              </h1>

              {/* Subtitle */}
              <p
                data-hero-subtitle
                className="text-lg lg:text-xl text-white/80 mb-8 max-w-lg leading-relaxed"
              >
                Pastelería artesanal premium con{' '}
                <span className="text-white font-medium">ingredientes selectos</span>,{' '}
                <span className="text-white font-medium">diseño único</span> y el sabor que dejará
                huella en tu evento especial.
              </p>

              {/* CTA Buttons */}
              <div
                data-hero-buttons
                className="flex flex-col sm:flex-row gap-4 mb-10"
              >
                <Link href="/agendar" className="group">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <span>Reserva tu fecha</span>
                    <svg
                      className="w-5 h-5 ml-2.5 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </Link>
                <Link href="/catalogo" className="group">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto border-2 border-white/60 text-white bg-white/10 hover:bg-white/20 hover:border-white backdrop-blur-md transition-all duration-300"
                  >
                    Explorar creaciones
                  </Button>
                </Link>
              </div>

              {/* Trust stats */}
              <div className="relative pt-6">
                <div
                  ref={statsBorderRef}
                  className="absolute top-0 left-0 right-0 h-px bg-white/20 origin-left"
                />
                <div
                  ref={statsRef}
                  className="flex flex-wrap gap-8"
                >
                  {STATS.map((stat, i) => (
                    <div key={i} className="flex items-baseline gap-2">
                      <span className="font-display text-2xl font-bold text-white">{stat.value}</span>
                      <span className="text-sm text-white/60">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}
