'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '@/components/ui'

gsap.registerPlugin(ScrollTrigger)

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const blobsRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Parallax mouse effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const x = (clientX / window.innerWidth - 0.5) * 2
      const y = (clientY / window.innerHeight - 0.5) * 2
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Animate blobs based on mouse
  useEffect(() => {
    if (!blobsRef.current) return
    const blobs = blobsRef.current.querySelectorAll('.blob')
    blobs.forEach((blob, i) => {
      gsap.to(blob, {
        x: mousePosition.x * (20 + i * 10),
        y: mousePosition.y * (15 + i * 8),
        duration: 1.2,
        ease: 'power2.out',
      })
    })
  }, [mousePosition])

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial state - hide elements
      gsap.set([badgeRef.current, titleRef.current, subtitleRef.current], {
        opacity: 0,
        y: 50
      })
      gsap.set(ctaRef.current?.children ?? [], { opacity: 0, y: 30 })
      gsap.set(featuresRef.current?.children ?? [], { opacity: 0, y: 20, scale: 0.9 })
      gsap.set(imageRef.current, { opacity: 0, scale: 0.85, rotate: -5 })

      const tl = gsap.timeline({
        defaults: { ease: 'power4.out' },
        delay: 0.2
      })

      // Badge animation
      tl.to(badgeRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.8,
      })
      // Title with split effect
      .to(titleRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.2,
      }, '-=0.4')
      // Subtitle
      .to(subtitleRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.9,
      }, '-=0.7')
      // CTA buttons with stagger
      .to(ctaRef.current?.children ?? [], {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.12,
      }, '-=0.5')
      // Features pills
      .to(featuresRef.current?.children ?? [], {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: 0.08,
      }, '-=0.4')
      // Image gallery with rotation
      .to(imageRef.current, {
        scale: 1,
        opacity: 1,
        rotate: 0,
        duration: 1.4,
        ease: 'elastic.out(1, 0.8)',
      }, '-=1.2')

      // Floating animation for images
      const images = imageRef.current?.querySelectorAll('[data-float]')
      images?.forEach((img, i) => {
        gsap.to(img, {
          y: '+=15',
          rotation: `+=${i % 2 === 0 ? 2 : -2}`,
          duration: 2.5 + i * 0.3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.2,
        })
      })

      // Parallax scroll effect
      gsap.to(imageRef.current, {
        y: 100,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })

    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={heroRef} className="relative min-h-screen flex items-center bg-gradient-to-br from-secondary via-white to-primary/5 overflow-hidden">
      {/* Animated Pattern Background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4847C' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Animated Gradient Blobs */}
      <div ref={blobsRef} className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob absolute -top-1/4 -right-1/4 w-[700px] h-[700px] bg-gradient-to-br from-primary/20 to-primary-light/10 rounded-full blur-3xl animate-blob" />
        <div className="blob absolute -bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-gradient-to-tr from-accent/15 to-accent-light/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="blob absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-3 h-3 bg-primary/30 rounded-full animate-float" />
        <div className="absolute top-[25%] right-[15%] w-2 h-2 bg-accent/40 rounded-full animate-float animation-delay-1000" />
        <div className="absolute bottom-[30%] left-[20%] w-4 h-4 bg-primary/20 rounded-full animate-float animation-delay-2000" />
        <div className="absolute bottom-[20%] right-[25%] w-2.5 h-2.5 bg-accent/30 rounded-full animate-float animation-delay-3000" />
        <div className="absolute top-[40%] left-[5%] w-2 h-2 bg-primary-light/40 rounded-full animate-float animation-delay-1500" />
      </div>

      <div className="relative container mx-auto px-4 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <div
              ref={badgeRef}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/95 backdrop-blur-md rounded-full text-primary font-semibold mb-8 shadow-lg border border-primary/10 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-default"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              Creadas con amor, celebradas con sabor
            </div>

            <h1
              ref={titleRef}
              className="font-body text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-dark mb-6 leading-[1.05] tracking-tight"
            >
              Convierte tu Evento en{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-primary">un Momento Inolvidable</span>
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/20" viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path d="M0,8 Q50,0 100,8 T200,8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            <p
              ref={subtitleRef}
              className="text-lg sm:text-xl md:text-2xl text-dark-light mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Tortas artesanales que roban suspiros. Con{' '}
              <span className="text-dark font-medium">ingredientes premium</span>,{' '}
              <span className="text-dark font-medium">relleno generoso</span> y el sabor que todos recordarán.
            </p>

            <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link href="/agendar" className="group">
                <Button size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <span>Reserva tu Fecha</span>
                  <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link href="/catalogo" className="group">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto hover:bg-dark hover:text-white hover:border-dark transition-all duration-300 group-hover:scale-105">
                  Explorar Creaciones
                </Button>
              </Link>
            </div>

            {/* Features destacados */}
            <div ref={featuresRef} className="flex flex-wrap gap-3 justify-center lg:justify-start">
              {[
                { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Elaboración Artesanal' },
                { icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', text: 'Diseño a tu Medida' },
                { icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', text: 'Sabores Premium' },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-md border border-white/50 hover:shadow-lg hover:scale-105 hover:bg-white transition-all duration-300 cursor-default"
                >
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                  </svg>
                  <span className="text-sm font-medium text-dark">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image Collage - 4 Fotos */}
          <div ref={imageRef} className="relative order-1 lg:order-2">
            <div className="relative h-[450px] sm:h-[500px] lg:h-[600px] w-full max-w-2xl mx-auto">
              {/* Decorative ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 animate-spin-slow" style={{ animationDuration: '30s' }} />

              {/* Main center image */}
              <div
                data-float
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[350px] sm:w-[320px] sm:h-[400px] lg:w-[360px] lg:h-[450px] z-30"
              >
                <div className="relative w-full h-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border-4 border-white group cursor-pointer hover:shadow-3xl transition-all duration-500">
                  <Image
                    src="/images/hero-1.jpg"
                    alt="Torta artesanal elegante"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>

              {/* Top right floating image */}
              <div
                data-float
                className="absolute top-0 right-0 sm:right-4 lg:right-8 w-[140px] h-[180px] sm:w-[160px] sm:h-[200px] lg:w-[180px] lg:h-[220px] z-20 transform rotate-6"
              >
                <div className="relative w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden border-3 border-white group cursor-pointer hover:shadow-2xl hover:rotate-3 transition-all duration-500">
                  <Image
                    src="/images/hero-2.jpg"
                    alt="Detalle de decoración premium"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    priority
                  />
                </div>
              </div>

              {/* Bottom left floating image */}
              <div
                data-float
                className="absolute bottom-4 left-0 sm:left-2 lg:left-4 w-[130px] h-[170px] sm:w-[150px] sm:h-[190px] lg:w-[170px] lg:h-[210px] z-20 transform -rotate-6"
              >
                <div className="relative w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden border-3 border-white group cursor-pointer hover:shadow-2xl hover:-rotate-3 transition-all duration-500">
                  <Image
                    src="/images/hero-3.jpg"
                    alt="Corte mostrando capas y relleno"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
              </div>

              {/* Bottom right floating badge */}
              <div
                data-float
                className="absolute bottom-8 right-4 sm:right-8 lg:right-16 z-40"
              >
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 border border-white/50 hover:scale-110 transition-transform duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-dark text-lg">500+</p>
                      <p className="text-xs text-dark-light">Clientes Felices</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top left floating badge */}
              <div
                data-float
                className="absolute top-8 left-0 sm:left-4 lg:left-8 z-40 hidden sm:block"
              >
                <div className="bg-white/95 backdrop-blur-md rounded-full shadow-xl px-4 py-2 border border-white/50 hover:scale-110 transition-transform duration-300">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <svg key={i} className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-dark">5.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:block">
        <a href="#productos" className="flex flex-col items-center gap-2 group cursor-pointer">
          <span className="text-xs text-dark-light font-medium group-hover:text-primary transition-colors">Descubre más</span>
          <div className="w-6 h-10 rounded-full border-2 border-dark/20 flex items-start justify-center p-1.5 group-hover:border-primary/50 transition-colors">
            <div className="w-1.5 h-3 bg-primary rounded-full animate-scroll-indicator" />
          </div>
        </a>
      </div>

      {/* Gradient fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  )
}
