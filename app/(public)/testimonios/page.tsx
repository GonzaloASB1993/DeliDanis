'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '@/lib/utils/cn'
import { PageHeader } from '@/components/public/PageHeader'
import {
  getTestimonialsPublic,
  submitTestimonialPublic,
  uploadTestimonialImage,
  type Testimonial,
} from '@/lib/supabase/testimonial-queries'

gsap.registerPlugin(ScrollTrigger)

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  'Matrimonio',
  'Cumpleaños',
  'Bautizo',
  'Quinceañero',
  'Corporativo',
  'Baby Shower',
  'Graduación',
  'Otro',
]

const MAX_IMAGES = 3
const MAX_FILE_SIZE_MB = 5

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn('w-4 h-4', star <= rating ? 'text-amber-400' : 'text-gray-200')}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function InteractiveStars({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
          aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
        >
          <svg
            className={cn(
              'w-8 h-8 transition-colors',
              star <= display ? 'text-amber-400' : 'text-gray-200'
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

// Avatar with gradient background derived from initials
const AVATAR_GRADIENTS = [
  'from-primary to-primary-light',
  'from-accent to-accent-light',
  'from-info to-primary-light',
  'from-success to-accent-light',
  'from-primary-light to-accent',
]

function Avatar({ initials, index }: { initials: string; index: number }) {
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
  return (
    <div
      className={cn(
        'w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0',
        gradient
      )}
    >
      <span className="text-white font-semibold text-sm font-body">{initials}</span>
    </div>
  )
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: Testimonial
  index: number
}) {
  const initials = testimonial.customer_initials || testimonial.customer_name[0] || '?'

  return (
    <article className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col gap-4">
      {/* Rating */}
      <StarRating rating={testimonial.rating} />

      {/* Comment */}
      <blockquote className="font-body text-dark-light text-sm leading-relaxed italic flex-1">
        <span className="text-primary font-display text-2xl leading-none mr-1">"</span>
        {testimonial.comment}
        <span className="text-primary font-display text-2xl leading-none ml-1">"</span>
      </blockquote>

      {/* Image thumbnails */}
      {testimonial.image_urls && testimonial.image_urls.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {testimonial.image_urls.map((url, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={url}
                alt={`Foto de ${testimonial.customer_name}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Author */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <Avatar initials={initials} index={index} />
        <div>
          <p className="font-body font-semibold text-dark text-sm">{testimonial.customer_name}</p>
          {testimonial.event_type && (
            <p className="font-body text-dark-light text-xs">{testimonial.event_type}</p>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── Form state type ──────────────────────────────────────────────────────────

interface FormState {
  customer_name: string
  customer_email: string
  event_type: string
  comment: string
  rating: number
}

interface FormErrors {
  customer_name?: string
  customer_email?: string
  comment?: string
  images?: string
}

interface ImagePreview {
  file: File
  preview: string
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TestimoniosPage() {
  // ── Testimonials list state ──
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)

  // ── Form state ──
  const [form, setForm] = useState<FormState>({
    customer_name: '',
    customer_email: '',
    event_type: '',
    comment: '',
    rating: 5,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Refs for GSAP ──
  const gridRef = useRef<HTMLDivElement>(null)
  const gridSectionRef = useRef<HTMLDivElement>(null)
  const formSectionRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Load testimonials ──
  useEffect(() => {
    getTestimonialsPublic()
      .then((data) => setTestimonials(data))
      .catch(() => setTestimonials([]))
      .finally(() => setLoadingTestimonials(false))
  }, [])

  // ── GSAP: testimonials grid stagger ──
  useEffect(() => {
    if (!gridRef.current || loadingTestimonials) return
    const cards = gridRef.current.children
    if (!cards.length) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      )
    }, gridSectionRef)
    return () => ctx.revert()
  }, [loadingTestimonials, testimonials])

  // ── GSAP: form section ──
  useEffect(() => {
    if (!formSectionRef.current) return
    const ctx = gsap.context(() => {
      gsap.from('.form-section-header', {
        opacity: 0,
        y: 40,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.form-section-header',
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })
      gsap.from('.form-card', {
        opacity: 0,
        y: 60,
        duration: 0.8,
        delay: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.form-card',
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      })
    }, formSectionRef)
    return () => ctx.revert()
  }, [])

  // ── Image handling ──
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files)
      const remaining = MAX_IMAGES - imagePreviews.length
      if (remaining <= 0) return

      const toAdd = arr.slice(0, remaining)
      const oversized = toAdd.filter((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024)

      if (oversized.length > 0) {
        setErrors((prev) => ({
          ...prev,
          images: `Cada imagen debe pesar menos de ${MAX_FILE_SIZE_MB} MB`,
        }))
        return
      }

      setErrors((prev) => ({ ...prev, images: undefined }))

      const previews: ImagePreview[] = toAdd.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))

      setImagePreviews((prev) => [...prev, ...previews])
    },
    [imagePreviews.length]
  )

  const removeImage = useCallback((index: number) => {
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => URL.revokeObjectURL(p.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Drag & drop ──
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }

  // ── Validation ──
  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!form.customer_name.trim()) {
      newErrors.customer_name = 'El nombre es requerido'
    }

    if (!form.customer_email.trim()) {
      newErrors.customer_email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) {
      newErrors.customer_email = 'Ingresa un email valido'
    }

    if (!form.comment.trim()) {
      newErrors.comment = 'Escribe tu experiencia'
    } else if (form.comment.trim().length < 20) {
      newErrors.comment = 'Tu experiencia debe tener al menos 20 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      // Upload images first (in parallel)
      let imageUrls: string[] = []
      if (imagePreviews.length > 0) {
        const uploadResults = await Promise.all(
          imagePreviews.map((p) => uploadTestimonialImage(p.file))
        )
        imageUrls = uploadResults.filter((url): url is string => url !== null)
      }

      const result = await submitTestimonialPublic({
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        event_type: form.event_type,
        comment: form.comment,
        rating: form.rating,
        image_urls: imageUrls,
      })

      if (!result.success) {
        setSubmitError(result.error ?? 'Ocurrio un error. Intenta de nuevo.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setSubmitError('Ocurrio un error inesperado. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        eyebrow={{
          text: 'Opiniones de clientes',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          ),
        }}
        title={
          <>
            Lo que dicen <span className="text-primary italic font-accent">nuestros clientes</span>
          </>
        }
        description="Cada torta cuenta una historia. Lee las experiencias de quienes confiaron en nosotros para sus momentos más especiales."
      />

      {/* ── Approved testimonials grid ───────────────────────────────────── */}
      <section ref={gridSectionRef} className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          {loadingTestimonials ? (
            /* Skeleton */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-secondary rounded-2xl p-6 animate-pulse">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((__, j) => (
                      <div key={j} className="w-4 h-4 rounded bg-border" />
                    ))}
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-border rounded w-full" />
                    <div className="h-3 bg-border rounded w-5/6" />
                    <div className="h-3 bg-border rounded w-4/6" />
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-12 h-12 rounded-full bg-border" />
                    <div className="space-y-1.5">
                      <div className="h-3 bg-border rounded w-24" />
                      <div className="h-2.5 bg-border rounded w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-dark-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-dark-light text-lg">Aun no hay testimonios aprobados. Se el primero en compartir tu experiencia.</p>
            </div>
          ) : (
            <div
              ref={gridRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {testimonials.map((t, i) => (
                <TestimonialCard key={t.id} testimonial={t} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Submit form section ───────────────────────────────────────────── */}
      <section
        ref={formSectionRef}
        className="py-16 md:py-20 bg-secondary"
      >
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          {/* Header */}
          <div className="form-section-header text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-primary font-medium mb-5 shadow-sm text-sm">
              {/* Pencil icon */}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Comparte tu experiencia
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-dark mb-4">
              Comparte tu{' '}
              <span className="text-primary">experiencia</span>
            </h2>
            <p className="text-dark-light text-base md:text-lg leading-relaxed max-w-lg mx-auto">
              Tu opinion nos ayuda a mejorar. Los testimonios son revisados antes de publicarse.
            </p>
          </div>

          {/* Form card */}
          {submitted ? (
            /* Success state */
            <div className="form-card bg-white rounded-2xl shadow-sm p-6 sm:p-10 text-center">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                {/* Check icon */}
                <svg className="w-10 h-10 text-success-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-display text-2xl font-bold text-dark mb-3">
                Gracias por tu testimonio
              </h3>
              <p className="text-dark-light leading-relaxed max-w-sm mx-auto">
                Sera revisado por nuestro equipo y publicado pronto. Apreciamos mucho que te hayas tomado el tiempo de compartir tu experiencia.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setForm({ customer_name: '', customer_email: '', event_type: '', comment: '', rating: 5 })
                  setImagePreviews([])
                }}
                className="mt-8 px-6 py-2.5 rounded-full border-2 border-dark/15 text-dark font-semibold text-sm hover:border-primary hover:text-primary transition-colors duration-300"
              >
                Enviar otro testimonio
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="form-card bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6"
            >
              {/* Nombre */}
              <div>
                <label className="block font-body text-sm font-semibold text-dark mb-1.5">
                  Nombre completo <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, customer_name: e.target.value }))
                    if (errors.customer_name) setErrors((prev) => ({ ...prev, customer_name: undefined }))
                  }}
                  placeholder="Ej: Maria Gonzalez"
                  className={cn(
                    'w-full border rounded-lg px-4 py-3 text-dark text-sm font-body placeholder-dark-light/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                    errors.customer_name ? 'border-red-400 bg-red-50' : 'border-border bg-white hover:border-primary/40'
                  )}
                />
                {errors.customer_name && (
                  <p className="mt-1.5 text-xs text-red-500 font-body">{errors.customer_name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block font-body text-sm font-semibold text-dark mb-1.5">
                  Email <span className="text-primary">*</span>
                </label>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, customer_email: e.target.value }))
                    if (errors.customer_email) setErrors((prev) => ({ ...prev, customer_email: undefined }))
                  }}
                  placeholder="tu@email.com"
                  className={cn(
                    'w-full border rounded-lg px-4 py-3 text-dark text-sm font-body placeholder-dark-light/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                    errors.customer_email ? 'border-red-400 bg-red-50' : 'border-border bg-white hover:border-primary/40'
                  )}
                />
                {errors.customer_email && (
                  <p className="mt-1.5 text-xs text-red-500 font-body">{errors.customer_email}</p>
                )}
                <p className="mt-1 text-xs text-dark-light font-body">Solo lo usamos para notificarte cuando tu testimonio sea aprobado.</p>
              </div>

              {/* Tipo de evento */}
              <div>
                <label className="block font-body text-sm font-semibold text-dark mb-1.5">
                  Tipo de evento
                </label>
                <div className="relative">
                  <select
                    value={form.event_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, event_type: e.target.value }))}
                    className="w-full border border-border rounded-lg px-4 py-3 text-dark text-sm font-body bg-white appearance-none cursor-pointer hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                  >
                    <option value="">Selecciona el tipo de evento (opcional)</option>
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {/* Chevron */}
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-dark-light">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Calificacion */}
              <div>
                <label className="block font-body text-sm font-semibold text-dark mb-2">
                  Calificacion <span className="text-primary">*</span>
                </label>
                <InteractiveStars
                  value={form.rating}
                  onChange={(v) => setForm((prev) => ({ ...prev, rating: v }))}
                />
                <p className="mt-1 text-xs text-dark-light font-body">
                  {form.rating === 5 && 'Excelente'}
                  {form.rating === 4 && 'Muy bueno'}
                  {form.rating === 3 && 'Bueno'}
                  {form.rating === 2 && 'Regular'}
                  {form.rating === 1 && 'Malo'}
                </p>
              </div>

              {/* Experiencia */}
              <div>
                <label className="block font-body text-sm font-semibold text-dark mb-1.5">
                  Tu experiencia <span className="text-primary">*</span>
                </label>
                <textarea
                  value={form.comment}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, comment: e.target.value }))
                    if (errors.comment) setErrors((prev) => ({ ...prev, comment: undefined }))
                  }}
                  placeholder="Cuentanos como fue tu experiencia con DeliDanis..."
                  rows={5}
                  className={cn(
                    'w-full border rounded-lg px-4 py-3 text-dark text-sm font-body placeholder-dark-light/60 resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                    errors.comment ? 'border-red-400 bg-red-50' : 'border-border bg-white hover:border-primary/40'
                  )}
                />
                <div className="flex justify-between mt-1">
                  {errors.comment ? (
                    <p className="text-xs text-red-500 font-body">{errors.comment}</p>
                  ) : (
                    <span />
                  )}
                  <p
                    className={cn(
                      'text-xs font-body',
                      form.comment.length < 20 ? 'text-dark-light' : 'text-success-dark'
                    )}
                  >
                    {form.comment.length} / min. 20 caracteres
                  </p>
                </div>
              </div>

              {/* Imagenes */}
              <div>
                <label className="block font-body text-sm font-semibold text-dark mb-1.5">
                  Imagenes{' '}
                  <span className="text-dark-light font-normal">
                    (opcional, max. {MAX_IMAGES} fotos de {MAX_FILE_SIZE_MB} MB c/u)
                  </span>
                </label>

                {/* Drop zone */}
                {imagePreviews.length < MAX_IMAGES && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
                      isDragging
                        ? 'border-primary bg-primary/5 scale-[1.01]'
                        : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                    )}
                  >
                    {/* Camera icon */}
                    <div className="flex justify-center mb-3">
                      <svg className="w-10 h-10 text-dark-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-dark font-body">
                      {isDragging ? 'Suelta las imagenes aqui' : 'Arrastra tus fotos o haz clic para elegir'}
                    </p>
                    <p className="text-xs text-dark-light font-body mt-1">
                      JPG, PNG, WEBP — max. {MAX_FILE_SIZE_MB} MB por imagen
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) addFiles(e.target.files)
                        e.target.value = ''
                      }}
                    />
                  </div>
                )}

                {/* Error */}
                {errors.images && (
                  <p className="mt-1.5 text-xs text-red-500 font-body">{errors.images}</p>
                )}

                {/* Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {imagePreviews.map((p, i) => (
                      <div key={i} className="relative group">
                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-border">
                          <Image
                            src={p.preview}
                            alt={`Preview ${i + 1}`}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Eliminar imagen"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {imagePreviews.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                      >
                        <svg className="w-5 h-5 text-dark-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs text-dark-light font-body">Agregar</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Submit error */}
              {submitError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700 font-body">{submitError}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  'w-full relative px-8 py-3.5 bg-primary text-white rounded-full font-semibold font-body text-[15px] transition-all duration-300 overflow-hidden',
                  submitting
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:shadow-[0_4px_20px_rgba(212,132,124,0.4)] active:scale-[0.98]'
                )}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Enviar Testimonio
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
                {!submitting && (
                  <div className="absolute inset-0 bg-primary-hover opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full" />
                )}
              </button>

              <p className="text-center text-xs text-dark-light font-body">
                Al enviar aceptas que revisemos tu testimonio antes de publicarlo.
              </p>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
