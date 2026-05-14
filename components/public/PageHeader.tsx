import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: {
    text: string
    icon?: ReactNode
  }
  title: ReactNode
  description?: string
  meta?: ReactNode
  align?: 'center' | 'left'
  tone?: 'light' | 'cream'
}

/**
 * Editorial-minimal page header used across internal pages
 * (Catálogo, Nosotros, Galería, Contacto, Testimonios, Seguimiento).
 *
 * Replaces the previous blob-soup hero with a refined, consistent layout.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  align = 'center',
  tone = 'light',
}: PageHeaderProps) {
  const isCenter = align === 'center'

  return (
    <section
      className={[
        'relative overflow-hidden',
        tone === 'cream' ? 'bg-secondary/40' : 'bg-white',
        'pt-20 pb-14 md:pt-28 md:pb-20',
        'border-b border-border/60',
      ].join(' ')}
    >
      {/* Subtle editorial ornament — a single hairline arc, not blob soup */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-[120%] rounded-[100%] bg-primary/[0.04] blur-2xl"
      />

      <div className="relative container mx-auto px-4 md:px-6 max-w-5xl">
        <div className={isCenter ? 'mx-auto text-center max-w-3xl' : 'max-w-3xl'}>
          {eyebrow && (
            <div
              className={[
                'inline-flex items-center gap-2',
                'text-[11px] font-semibold uppercase tracking-[0.18em]',
                'text-primary mb-5',
              ].join(' ')}
            >
              {eyebrow.icon && (
                <span className="text-primary/70" aria-hidden="true">
                  {eyebrow.icon}
                </span>
              )}
              {eyebrow.text}
              <span
                aria-hidden="true"
                className="ml-1 inline-block w-8 h-px bg-primary/40"
              />
            </div>
          )}

          <h1 className="font-display font-bold text-dark leading-[1.05] text-4xl md:text-5xl lg:text-[3.5rem] tracking-tight">
            {title}
          </h1>

          {description && (
            <p
              className={[
                'mt-5 md:mt-6 text-dark-light text-base md:text-lg leading-relaxed',
                isCenter ? 'mx-auto max-w-2xl' : 'max-w-2xl',
              ].join(' ')}
            >
              {description}
            </p>
          )}

          {meta && (
            <div
              className={[
                'mt-8 flex flex-wrap gap-3',
                isCenter ? 'justify-center' : '',
              ].join(' ')}
            >
              {meta}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/**
 * Small inline chip used inside PageHeader `meta` slots.
 * Keeps consistent visual weight across pages.
 */
export function PageHeaderChip({
  icon,
  children,
}: {
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-dark shadow-sm">
      {icon && (
        <span className="text-primary" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}
