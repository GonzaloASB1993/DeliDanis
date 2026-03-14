'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '@/components/ui'

gsap.registerPlugin(ScrollTrigger)

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const content = contentRef.current
      const image = imageRef.current
      const badge = badgeRef.current
      const stats = statsRef.current
      if (!content || !image) return

      // Create a timeline for orchestrated entrance
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        delay: 0.2,
      })

      // Badge slides in first
      if (badge) {
        tl.fromTo(badge, { opacity: 0, y: 20, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.6 })
      }

      // Title lines reveal with stagger
      const titleLines = content.querySelectorAll('[data-hero-title]')
      if (titleLines.length > 0) {
        tl.fromTo(
          titleLines,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 },
          '-=0.3'
        )
      }

      // Subtitle
      const subtitle = content.querySelector('[data-hero-subtitle]')
      if (subtitle) {
        tl.fromTo(subtitle, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
      }

      // Buttons
      const buttons = content.querySelector('[data-hero-buttons]')
      if (buttons) {
        tl.fromTo(buttons, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
      }

      // Stats
      if (stats) {
        tl.fromTo(
          stats.children,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
          '-=0.3'
        )
      }

      // Image entrance - slightly delayed for drama
      tl.fromTo(
        image,
        { opacity: 0, scale: 0.94, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'power2.out' },
        '-=0.8'
      )

      // Floating badges on the image
      const floatingBadges = image.querySelectorAll('[data-floating]')
      if (floatingBadges.length > 0) {
        tl.fromTo(
          floatingBadges,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(1.5)' },
          '-=0.5'
        )
      }

      // Subtle parallax on scroll
      gsap.to(image, {
        y: 50,
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
      className="relative min-h-[calc(100vh-5rem)] flex items-center overflow-hidden"
    >
      {/* Refined background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-white to-primary/[0.03]" />

      {/* Subtle organic shapes */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/[0.05] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-dark) 1px, transparent 0)',
        backgroundSize: '48px 48px',
      }} />

      <div className="relative container mx-auto px-4 lg:px-8 py-12 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div ref={contentRef} className="text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <div
              ref={badgeRef}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full text-sm mb-7 shadow-sm border border-primary/10"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-primary font-semibold">Creadas con amor, celebradas con sabor</span>
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold text-dark mb-6 leading-[1.08] tracking-tight">
              <span data-hero-title className="block">Tortas que Transforman</span>
              <span data-hero-title className="block">
                <span className="relative inline-block">
                  <span className="text-primary">tu Celebracion</span>
                  <svg className="absolute -bottom-1.5 left-0 w-full h-3 text-primary/25" viewBox="0 0 200 12" preserveAspectRatio="none">
                    <path d="M0,8 Q50,0 100,8 T200,8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
                {' '}en Arte
              </span>
            </h1>

            {/* Subtitle */}
            <p
              data-hero-subtitle
              className="text-lg lg:text-xl text-dark-light mb-9 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Pasteleria artesanal premium con{' '}
              <span className="text-dark font-semibold">ingredientes selectos</span>,{' '}
              <span className="text-dark font-semibold">diseno unico</span> y el sabor que dejara huella en tu evento especial.
            </p>

            {/* CTA Buttons */}
            <div data-hero-buttons className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <Link href="/agendar" className="group">
                <Button
                  size="lg"
                  className="w-full sm:w-auto shadow-[0_4px_20px_rgba(212,132,124,0.3)] hover:shadow-[0_8px_30px_rgba(212,132,124,0.4)] transition-all duration-400"
                >
                  <span>Reserva tu Fecha</span>
                  <svg className="w-5 h-5 ml-2.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link href="/catalogo" className="group">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto transition-all duration-300"
                >
                  Explorar Creaciones
                </Button>
              </Link>
            </div>

            {/* Trust stats */}
            <div ref={statsRef} className="flex flex-wrap gap-8 justify-center lg:justify-start pt-8 border-t border-border/40">
              {[
                { value: '500+', label: 'Eventos Celebrados' },
                { value: '5.0', label: 'Calificacion' },
                { value: '10+', label: 'Anos de Experiencia' },
              ].map((stat, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold text-dark">{stat.value}</span>
                  <span className="text-sm text-dark-light">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div ref={imageRef} className="relative order-1 lg:order-2 will-change-transform">
            <div className="relative aspect-[4/5] max-w-[380px] mx-auto lg:max-w-[440px]">
              {/* Decorative ring behind image */}
              <div className="absolute -inset-4 rounded-[2rem] border border-primary/10 -z-10" />
              <div className="absolute -inset-8 rounded-[2.5rem] border border-primary/[0.05] -z-10" />

              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(61,61,61,0.15)] ring-1 ring-black/5">
                <Image
                  src="/images/hero-1.jpg"
                  alt="Torta artesanal elegante de DeliDanis"
                  fill
                  sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 440px"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark/15 via-transparent to-transparent" />
              </div>

              {/* Floating badge - bottom left */}
              <div
                data-floating
                className="absolute -bottom-4 -left-4 sm:-bottom-5 sm:-left-5 bg-white rounded-2xl shadow-lg p-4 border border-border/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-dark text-base leading-none">500+</p>
                    <p className="text-xs text-dark-light mt-1">Clientes Felices</p>
                  </div>
                </div>
              </div>

              {/* Rating badge - top right */}
              <div
                data-floating
                className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-white rounded-2xl shadow-lg px-4 py-2.5 border border-border/20 hidden sm:flex items-center gap-2"
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-bold text-dark">5.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 text-dark-light/60">
        <span className="text-xs font-medium tracking-widest uppercase">Descubre</span>
        <div className="w-5 h-8 rounded-full border-2 border-dark-light/30 flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-dark-light/40 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}
