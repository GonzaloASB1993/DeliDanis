'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getTestimonialsPublic, type Testimonial as DBTestimonial } from '@/lib/supabase/testimonial-queries'

gsap.registerPlugin(ScrollTrigger)

// ─── Shape used internally by this component ──────────────────────────────────

interface Testimonial {
  id: string
  name: string
  event: string
  comment: string
  rating: number
  initials: string
}

// ─── Hardcoded fallback (shown while loading or if DB is empty / unreachable) ─

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Maria Gonzalez',
    event: 'Boda',
    comment:
      'La torta de nuestra boda fue espectacular. Todos los invitados quedaron encantados con el sabor y la presentacion. Supero nuestras expectativas!',
    rating: 5,
    initials: 'MG',
  },
  {
    id: '2',
    name: 'Carlos Ramirez',
    event: 'Evento Corporativo',
    comment:
      'Excelente servicio y atencion al detalle. La torta con el logo de nuestra empresa quedo perfecta. Definitivamente volveremos a ordenar.',
    rating: 5,
    initials: 'CR',
  },
  {
    id: '3',
    name: 'Ana Martinez',
    event: 'Quinceañera',
    comment:
      'Mi hija quedo feliz con su torta de quinceañera. El diseno personalizado fue exactamente lo que imaginamos. Totalmente recomendados.',
    rating: 5,
    initials: 'AM',
  },
  {
    id: '4',
    name: 'Luis Hernandez',
    event: 'Cumpleaños',
    comment:
      'La atencion personalizada y el resultado final fueron increibles. La torta no solo se veia hermosa, sino que el sabor era excepcional.',
    rating: 5,
    initials: 'LH',
  },
  {
    id: '5',
    name: 'Patricia Silva',
    event: 'Baby Shower',
    comment:
      'Quede maravillada con el nivel de detalle y creatividad. La torta fue el centro de atencion de la fiesta. Muchas gracias!',
    rating: 5,
    initials: 'PS',
  },
]

// ─── Map a DB row to the component's internal shape ───────────────────────────

function mapDbToTestimonial(db: DBTestimonial): Testimonial {
  const initials =
    db.customer_initials?.trim() ||
    db.customer_name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('')

  return {
    id: db.id,
    name: db.customer_name,
    event: db.event_type ?? '',
    comment: db.comment,
    rating: db.rating,
    initials,
  }
}

// ─── Star rating ──────────────────────────────────────────────────────────────

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`${count} de 5 estrellas`}>
      {[...Array(count)].map((_, i) => (
        <svg key={i} className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TestimonialsCarousel() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK_TESTIMONIALS)
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isInView, setIsInView] = useState(false)

  const sectionRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const featuredRef = useRef<HTMLDivElement>(null)
  const sideCardsRef = useRef<HTMLDivElement>(null)
  const quoteIconRef = useRef<SVGSVGElement>(null)
  const isAnimatingRef = useRef(false)

  // ── Fetch from Supabase; fall back to hardcoded if empty or errored ─────────
  useEffect(() => {
    getTestimonialsPublic()
      .then((data) => {
        if (data && data.length > 0) {
          setTestimonials(data.map(mapDbToTestimonial))
          setFeaturedIndex(0)
        }
        // else: keep the fallback array already set in useState initial value
      })
      .catch(() => {
        // Network failure — fallback already in state, do nothing
      })
  }, [])

  const featured = testimonials[featuredIndex] ?? testimonials[0]

  // Get side cards: all testimonials except the featured one
  const sideCards = testimonials.filter((_, i) => i !== featuredIndex)

  // Intersection observer
  useEffect(() => {
    if (!sectionRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2 }
    )

    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  // GSAP entrance animations
  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      // Header quote icon: scale + rotation reveal
      if (quoteIconRef.current) {
        gsap.fromTo(
          quoteIconRef.current,
          { opacity: 0, scale: 0.8, rotation: -8 },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // Header title
      if (headerRef.current) {
        const title = headerRef.current.querySelector('h2')
        if (title) {
          gsap.fromTo(
            title,
            { opacity: 0, y: 25 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              delay: 0.15,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: headerRef.current,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          )
        }
      }

      // Featured card entrance
      if (featuredRef.current) {
        gsap.fromTo(
          featuredRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: featuredRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // Side cards stagger from right
      if (sideCardsRef.current) {
        gsap.fromTo(
          sideCardsRef.current.children,
          { opacity: 0, x: 30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sideCardsRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  // Crossfade animation for featured testimonial change
  const animateFeaturedChange = useCallback(
    (newIndex: number) => {
      if (isAnimatingRef.current || newIndex === featuredIndex) return
      if (!featuredRef.current) {
        setFeaturedIndex(newIndex)
        return
      }

      isAnimatingRef.current = true

      const tl = gsap.timeline({
        onComplete: () => {
          isAnimatingRef.current = false
        },
      })

      // Fade out current
      tl.to(featuredRef.current, {
        opacity: 0,
        y: -12,
        duration: 0.3,
        ease: 'power2.in',
      })

      // Update content and fade in
      tl.call(() => setFeaturedIndex(newIndex))
      tl.fromTo(
        featuredRef.current,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power3.out',
        }
      )
    },
    [featuredIndex]
  )

  // Auto-play: rotate featured testimonial every 5s
  useEffect(() => {
    if (isPaused || !isInView) return

    const interval = setInterval(() => {
      const nextIndex = (featuredIndex + 1) % testimonials.length
      animateFeaturedChange(nextIndex)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused, isInView, featuredIndex, animateFeaturedChange, testimonials.length])

  const handleSideCardClick = (testimonialId: string) => {
    const newIndex = testimonials.findIndex((t) => t.id === testimonialId)
    if (newIndex !== -1) {
      animateFeaturedChange(newIndex)
    }
  }

  if (!featured) return null

  return (
    <section
      id="testimonios"
      ref={sectionRef}
      className="section-padding bg-gradient-to-b from-white via-secondary/20 to-white relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Decorative blurs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/[0.03] rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-accent/[0.03] rounded-full blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Asymmetric Section Header */}
        <div ref={headerRef} className="flex items-center gap-4 lg:gap-6 mb-10 lg:mb-12">
          <svg
            ref={quoteIconRef}
            className="w-20 h-20 lg:w-[120px] lg:h-[120px] text-primary/[0.07] flex-shrink-0 -mt-2"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-dark leading-[1.1]">
            Historias que nos{' '}
            <span className="text-primary italic font-accent">inspiran</span>
          </h2>
        </div>

        {/* Main layout: featured + side cards */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Featured testimonial — left, spans 3 cols */}
          <div className="lg:col-span-3" ref={featuredRef}>
            <div className="relative bg-primary/5 border-l-4 border-primary rounded-2xl p-8 lg:p-10 h-full">
              {/* Decorative quote mark */}
              <div className="absolute top-6 right-8 text-primary/[0.06]" aria-hidden="true">
                <svg className="w-16 h-16 lg:w-20 lg:h-20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <StarRating count={featured.rating} />
              </div>

              {/* Quote */}
              <blockquote className="text-dark text-xl lg:text-2xl mb-8 leading-relaxed font-light italic font-body">
                &ldquo;{featured.comment}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4 pt-6 border-t border-primary/10">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary via-primary-light to-accent-light flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white font-bold text-base">
                    {featured.initials}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-dark text-base">{featured.name}</div>
                  <div className="text-sm text-dark-light">{featured.event}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Side cards — right, spans 2 cols */}
          {/* Desktop: stacked cards, Mobile: hidden (dots pagination instead) */}
          <div
            ref={sideCardsRef}
            className="hidden lg:flex lg:col-span-2 flex-col gap-4"
          >
            {sideCards.map((testimonial) => (
              <button
                key={testimonial.id}
                onClick={() => handleSideCardClick(testimonial.id)}
                className="group bg-white rounded-2xl p-5 border border-border/30 text-left transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                aria-label={`Ver testimonio de ${testimonial.name}`}
              >
                {/* Truncated quote */}
                <p className="text-dark-light text-sm leading-relaxed mb-3 line-clamp-2 italic">
                  &ldquo;{testimonial.comment}&rdquo;
                </p>

                {/* Author row */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-xs">
                      {testimonial.initials}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-dark text-sm truncate">{testimonial.name}</div>
                    <div className="text-xs text-dark-light">{testimonial.event}</div>
                  </div>
                  {/* Arrow hint */}
                  <svg
                    className="w-4 h-4 text-primary/0 group-hover:text-primary/60 transition-all duration-300 ml-auto flex-shrink-0 -translate-x-1 group-hover:translate-x-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile pagination dots */}
        <div className="flex items-center justify-center mt-8 lg:hidden">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => animateFeaturedChange(index)}
              className="flex items-center justify-center min-h-[44px] px-1.5"
              aria-label={`Ir a testimonio ${index + 1}`}
            >
              <span className={`block h-2 rounded-full transition-all duration-300 ${
                index === featuredIndex
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-dark/15 hover:bg-dark/30'
              }`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
