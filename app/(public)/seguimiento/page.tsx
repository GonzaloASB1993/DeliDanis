'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import Link from 'next/link'

if (typeof window !== 'undefined') {
  gsap.registerPlugin()
}

export default function SeguimientoPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const heroRef = useRef<HTMLElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const tipsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()
      tl.from('[data-hero-badge]', { y: 20, opacity: 0, duration: 0.5, ease: 'power3.out' })
        .from('[data-hero-title]', { y: 40, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3')
        .from('[data-hero-subtitle]', { y: 30, opacity: 0, duration: 0.5, ease: 'power3.out' }, '-=0.4')

      if (formRef.current) {
        tl.from(formRef.current, { y: 40, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
      }
      if (tipsRef.current) {
        tl.from(tipsRef.current, { y: 30, opacity: 0, duration: 0.5, ease: 'power3.out' }, '-=0.2')
      }
    }, heroRef)

    return () => ctx.revert()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmed = orderNumber.trim().toUpperCase()
    if (!trimmed) {
      setError('Ingresa tu numero de pedido')
      return
    }

    // Normalize: accept "0001", "DD0001", "DD-0001"
    let normalized = trimmed
    if (/^\d+$/.test(normalized)) {
      normalized = `DD-${normalized.padStart(4, '0')}`
    } else if (/^DD\d+$/i.test(normalized)) {
      normalized = `DD-${normalized.slice(2).padStart(4, '0')}`
    } else if (!/^DD-\d+$/i.test(normalized)) {
      setError('Formato invalido. Ejemplo: DD-0001')
      return
    }

    setIsLoading(true)
    router.push(`/seguimiento/${normalized}`)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderNumber(e.target.value)
    if (error) setError('')
  }

  return (
    <div className="min-h-screen bg-light-alt">
      {/* Hero + Form Section */}
      <section
        ref={heroRef}
        className="relative bg-gradient-to-br from-primary/10 via-secondary to-accent/10 py-16 md:py-24 overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary/30 rounded-full" />
          <div className="absolute top-20 right-20 w-32 h-32 border-2 border-accent/30 rounded-full" />
          <div className="absolute bottom-20 left-1/4 w-24 h-24 border-2 border-primary/30 rounded-full" />
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 md:px-6 max-w-2xl">
          <div className="text-center mb-10">
            {/* Badge */}
            <div
              data-hero-badge
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-primary font-medium mb-5 shadow-sm text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Seguimiento de Pedido
            </div>

            <h1
              data-hero-title
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-dark mb-4 leading-[1.1]"
            >
              Consulta el estado de{' '}
              <span className="text-primary">tu pedido</span>
            </h1>

            <p data-hero-subtitle className="text-dark-light text-lg max-w-md mx-auto">
              Ingresa tu numero de pedido para ver el progreso en tiempo real
            </p>
          </div>

          {/* Search Form */}
          <div ref={formRef} className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-border/30">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium text-dark mb-2">
                  Numero de Pedido
                </label>
                <div className="relative">
                  <input
                    id="orderNumber"
                    type="text"
                    value={orderNumber}
                    onChange={handleChange}
                    placeholder="DD-0001"
                    className={`w-full px-5 py-3.5 text-lg rounded-xl border ${
                      error ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                    } focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-dark-light/40 font-mono tracking-wider`}
                    autoComplete="off"
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-dark-light/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-primary flex items-center gap-1.5">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 bg-primary text-white rounded-full font-semibold text-[15px] hover:bg-primary-hover transition-all duration-300 hover:shadow-[0_4px_20px_rgba(212,132,124,0.4)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Buscando...
                  </>
                ) : (
                  <>
                    Consultar Pedido
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Help tips */}
          <div ref={tipsRef} className="mt-6 text-center space-y-3">
            <p className="text-sm text-dark-light">
              Puedes encontrar tu numero de pedido en el email de confirmacion
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <a
                href="https://wa.me/56939282764"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-dark-light hover:text-dark transition-colors"
              >
                <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Necesitas ayuda?
              </a>
              <span className="text-border">|</span>
              <Link href="/contacto" className="text-dark-light hover:text-dark transition-colors">
                Contactanos
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
