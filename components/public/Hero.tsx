'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '@/components/ui'

gsap.registerPlugin(ScrollTrigger)

const SLIDES = [
  { src: '/images/hero-1.jpg', alt: 'Torta artesanal elegante de DeliDanis' },
  { src: '/images/hero-2.jpg', alt: 'Decoración premium de torta personalizada' },
  { src: '/images/hero-3.jpg', alt: 'Torta de celebración con detalles únicos' },
  { src: '/images/hero-4.jpg', alt: 'Creación artesanal para evento especial' },
] as const

const STATS = [
  { value: '150+', label: 'Eventos Celebrados' },
  { value: '5.0', label: 'Calificación' },
  { value: '3 años', label: 'De Experiencia' },
] as const

const SLIDE_DURATION = 6000

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const statsBorderRef = useRef<HTMLDivElement>(null)
  const floatingBadge1Ref = useRef<HTMLDivElement>(null)
  const floatingBadge2Ref = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  // ── Slide transition ──
  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index === currentSlide) return
    setIsAnimating(true)

    const currentEl = slideRefs.current[currentSlide]
    const nextEl = slideRefs.current[index]
    if (!currentEl || !nextEl) { setIsAnimating(false); return }

    // Next slide enters
    gsap.set(nextEl, { opacity: 0, scale: 1.1 })

    const tl = gsap.timeline({
      onComplete: () => {
        setCurrentSlide(index)
        setIsAnimating(false)
      },
    })

    // Crossfade with a subtle zoom-out on the incoming image
    tl.to(currentEl, {
      opacity: 0,
      scale: 1.05,
      duration: 1.2,
      ease: 'power2.inOut',
    })
    .to(nextEl, {
      opacity: 1,
      scale: 1,
      duration: 1.2,
      ease: 'power2.inOut',
    }, '<')
  }, [currentSlide, isAnimating])

  // ── Auto-play ──
  useEffect(() => {
    if (!hasLoaded) return

    timerRef.current = setInterval(() => {
      const next = (currentSlide + 1) % SLIDES.length
      goToSlide(next)
    }, SLIDE_DURATION)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentSlide, hasLoaded, goToSlide])

  // ── Progress bar animation ──
  useEffect(() => {
    if (!hasLoaded || !progressRef.current) return

    gsap.fromTo(
      progressRef.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: SLIDE_DURATION / 1000,
        ease: 'none',
        transformOrigin: 'left center',
      }
    )
  }, [currentSlide, hasLoaded])

  // ── Ken Burns slow zoom on active slide ──
  useEffect(() => {
    const activeEl = slideRefs.current[currentSlide]
    if (!activeEl || !hasLoaded) return

    gsap.fromTo(
      activeEl,
      { scale: 1 },
      {
        scale: 1.08,
        duration: SLIDE_DURATION / 1000 + 1.5,
        ease: 'none',
      }
    )
  }, [currentSlide, hasLoaded])

  // ── Initial entrance animation ──
  useEffect(() => {
    const ctx = gsap.context(() => {
      const content = contentRef.current
      const badge = badgeRef.current
      const stats = statsRef.current
      const statsBorder = statsBorderRef.current
      const overlay = overlayRef.current
      const floatingBadge1 = floatingBadge1Ref.current
      const floatingBadge2 = floatingBadge2Ref.current
      if (!content) return

      // Respect reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) {
        gsap.set(
          [badge, overlay, floatingBadge1, floatingBadge2, stats?.children, statsBorder].filter(Boolean),
          { opacity: 1, y: 0, scaleX: 1, scale: 1 }
        )
        const titles = content.querySelectorAll('[data-hero-title-inner]')
        gsap.set(titles, { y: '0%' })
        const subtitle = content.querySelector('[data-hero-subtitle]')
        if (subtitle) gsap.set(subtitle, { opacity: 1, y: 0 })
        const buttons = content.querySelector('[data-hero-buttons]')
        if (buttons) gsap.set(buttons, { opacity: 1, y: 0 })
        setHasLoaded(true)
        return
      }

      // First slide initial state
      const firstSlide = slideRefs.current[0]
      if (firstSlide) {
        gsap.set(firstSlide, { opacity: 1, scale: 1.15 })
      }

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        delay: 0.2,
        onComplete: () => setHasLoaded(true),
      })

      // 1. Image reveal — zoom out from 1.15 to 1
      if (firstSlide) {
        tl.to(firstSlide, {
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

      // 9. Floating badges — pop in
      if (floatingBadge1) {
        tl.fromTo(
          floatingBadge1,
          { opacity: 0, scale: 0.8, y: 10 },
          { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.5)' },
          '-=0.4'
        )
      }
      if (floatingBadge2) {
        tl.fromTo(
          floatingBadge2,
          { opacity: 0, scale: 0.8, y: -10 },
          { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.5)' },
          '-=0.4'
        )
      }

      // ── Floating badges idle animation ──
      if (floatingBadge1) {
        gsap.to(floatingBadge1, {
          y: '+=8',
          duration: 2.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 2.5,
        })
      }
      if (floatingBadge2) {
        gsap.to(floatingBadge2, {
          y: '+=6',
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 3,
        })
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

  const handleSlideClick = (index: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    goToSlide(index)
  }

  return (
    <section
      ref={heroRef}
      className="relative h-[100svh] min-h-[600px] max-h-[1000px] overflow-hidden"
    >
      {/* ── Full-bleed background images ── */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          ref={(el) => { slideRefs.current[i] = el }}
          className="absolute inset-0 will-change-transform"
          style={{ opacity: i === 0 ? 1 : 0 }}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            sizes="100vw"
            className="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      {/* ── Gradient overlay for text readability ── */}
      <div
        ref={overlayRef}
        className="absolute inset-0 z-10"
      >
        {/* Left side: strong gradient for text */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark/75 via-dark/40 to-transparent" />
        {/* Bottom: subtle gradient for stats */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark/50 via-transparent to-dark/10" />
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
                    className="w-full sm:w-auto shadow-[0_4px_24px_rgba(212,132,124,0.4)] hover:shadow-[0_8px_32px_rgba(212,132,124,0.5)] transition-all duration-400"
                  >
                    <span>Reserva tu Fecha</span>
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
                    className="w-full sm:w-auto border-white/25 text-white hover:bg-white/10 hover:border-white/40 backdrop-blur-sm transition-all duration-300"
                  >
                    Explorar Creaciones
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

      {/* ── Floating badges (right side of viewport) ── */}
      <div
        ref={floatingBadge1Ref}
        data-floating
        className="absolute bottom-32 right-6 lg:right-12 z-30 will-change-transform hidden sm:block"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-white/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold text-dark text-lg leading-tight">200+</p>
              <p className="text-xs text-dark-light">Clientes Felices</p>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={floatingBadge2Ref}
        data-floating
        className="absolute top-28 right-8 lg:right-20 z-30 will-change-transform hidden sm:block"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-full shadow-2xl px-5 py-3 border border-white/50">
          <div className="flex items-center gap-2.5">
            <div className="flex -space-x-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg
                  key={i}
                  className="w-4.5 h-4.5 text-accent"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-bold text-dark">5.0</span>
          </div>
        </div>
      </div>

      {/* ── Slide indicators + progress ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => handleSlideClick(i)}
            className={`relative h-1.5 rounded-full transition-all duration-500 overflow-hidden ${
              i === currentSlide ? 'w-10 bg-white/30' : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Ir a imagen ${i + 1}`}
          >
            {i === currentSlide && (
              <div
                ref={progressRef}
                className="absolute inset-0 bg-white rounded-full origin-left"
              />
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
