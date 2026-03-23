# SEO + Analytics — Design Spec
**Date:** 2026-03-23
**Status:** Approved by user

---

## Scope

Implement full SEO coverage and Vercel Analytics for the DeliDanis public site. No testing, no accessibility, no performance audit in this scope.

**Domain:** `https://delidanis.cl`

---

## 1. Metadata per page

### Central config — `lib/utils/seo.ts`

```typescript
import type { Metadata } from 'next'

export const BASE_URL = 'https://delidanis.cl'
// public/logo.png exists but is a logo (not 1200×630).
// Do NOT hardcode width/height for the default OG image — let platforms measure it.
export const DEFAULT_OG_IMAGE = `${BASE_URL}/logo.png`

interface BuildMetadataParams {
  title: string
  description: string
  path: string        // e.g. '/catalogo'
  image?: string      // absolute URL; falls back to DEFAULT_OG_IMAGE
  noIndex?: boolean   // set true for pages that should not be indexed
}

export function buildMetadata({ title, description, path, image, noIndex }: BuildMetadataParams): Metadata {
  const url = `${BASE_URL}${path}`
  const ogImage = image ?? DEFAULT_OG_IMAGE
  return {
    metadataBase: new URL(BASE_URL), // required: prevents Next.js 14 warning + fixes relative OG image URLs
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: 'DeliDanis',
      images: [{ url: ogImage, alt: title }], // no width/height — logo is not 1200×630
      locale: 'es_CL',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}
```

### Static pages metadata

Each public page exports `metadata` using `buildMetadata`:

| Page file | Title | Description | noIndex |
|-----------|-------|-------------|---------|
| `app/(public)/page.tsx` | DeliDanis — Pastelería Premium en Chile | Tortas artesanales para matrimonios, quinceañeros y eventos. Diseños únicos, sabores memorables. | false |
| `app/(public)/catalogo/page.tsx` | Catálogo — DeliDanis | Explora nuestra colección de tortas, pastelería y coctelería para eventos especiales. | false |
| `app/(public)/catalogo/pasteleria/page.tsx` | Pastelería — DeliDanis | Pie de limón, tartas, cheesecakes, alfajores, brownies y dulces finos para matrimonios, cumpleaños y eventos corporativos. | false |
| `app/(public)/catalogo/cocteleria/page.tsx` | Coctelería — DeliDanis | Cócteles artesanales, limonadas, mini sandwiches, empanaditas y bocadillos para matrimonios y celebraciones. | false |
| `app/(public)/agendar/page.tsx` | Agenda tu Pedido — DeliDanis | Reserva tu torta o servicio con anticipación. Proceso simple, confirmación inmediata. | false |
| `app/(public)/agendar/confirmacion/page.tsx` | Confirmación — DeliDanis | Tu pedido ha sido recibido. | true |
| `app/(public)/nosotros/page.tsx` | Nosotros — DeliDanis | Conoce la historia y el equipo detrás de DeliDanis. | false |
| `app/(public)/galeria/page.tsx` | Galería — DeliDanis | Inspirate con nuestras creaciones: tortas de matrimonio, quinceañeros y más. | false |
| `app/(public)/contacto/page.tsx` | Contacto — DeliDanis | Escríbenos, llámanos o visítanos. Estamos para ayudarte a planificar tu evento. | false |
| `app/(public)/testimonios/page.tsx` | Testimonios — DeliDanis | Lo que dicen nuestros clientes sobre sus experiencias con DeliDanis. | false |
| `app/(public)/seguimiento/page.tsx` | Seguimiento de Pedido — DeliDanis | Consulta el estado de tu pedido en tiempo real. | false |
| `app/(public)/seguimiento/[codigo]/page.tsx` | Seguimiento — DeliDanis | Estado de tu pedido. | true (static `metadata` const, NOT `generateMetadata`) |

Note: `/seguimiento/[codigo]` uses a static exported `metadata` constant (not `generateMetadata`) since no dynamic data is needed for the metadata — just the noIndex flag.

### Dynamic product pages (`/catalogo/[slug]`)

`app/(public)/catalogo/[slug]/page.tsx` is confirmed to exist.

`getProductBySlug` does **not** exist in `product-queries.ts`. Add it:

```typescript
// lib/supabase/product-queries.ts — add this function
import { createServerClient } from '@/lib/supabase/server' // already imported at top of file

export async function getProductBySlug(slug: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, description, short_description, base_price, is_active, product_images(url, is_primary)')
    .eq('slug', slug)
    .single()
  return data
}
```

Behavior: if the product is not found or `is_active = false`, call `notFound()` from `next/navigation` — do not render the page. This keeps inactive product URLs out of Google's index naturally.

Export `generateMetadata({ params })` in `app/(public)/catalogo/[slug]/page.tsx`:
- Fetch product via `getProductBySlug(params.slug)` — call `notFound()` if null or inactive
- Title: `{product.name} — DeliDanis`
- Description: `product.short_description ?? product.description.slice(0, 155)`
- OG image: primary image URL from `product_images` where `is_primary = true`, else `DEFAULT_OG_IMAGE`

---

## 2. sitemap.xml + robots.txt

### `app/sitemap.ts`

Native Next.js App Router — no external libraries.

```typescript
import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/utils/seo'
import { getActiveProductSlugs } from '@/lib/supabase/product-queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getActiveProductSlugs()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, priority: 1.0, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/catalogo`, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/catalogo/pasteleria`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/catalogo/cocteleria`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/agendar`, priority: 0.9, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/galeria`, priority: 0.7, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/nosotros`, priority: 0.6, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/contacto`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/testimonios`, priority: 0.6, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/seguimiento`, priority: 0.4, changeFrequency: 'monthly' },
  ]

  const productRoutes: MetadataRoute.Sitemap = products.map(p => ({
    url: `${BASE_URL}/catalogo/${p.slug}`,
    priority: 0.8,
    changeFrequency: 'monthly',
  }))

  return [...staticRoutes, ...productRoutes]
}
```

Using `MetadataRoute.Sitemap` as the explicit type for both arrays avoids the `changeFrequency` string-literal inference issue.

Add helper to `lib/supabase/product-queries.ts`:

```typescript
export async function getActiveProductSlugs(): Promise<{ slug: string }[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('products')
    .select('slug')
    .eq('is_active', true)
  if (error) throw new Error(`getActiveProductSlugs: ${error.message}`)
  return data ?? []
}
```

Error is thrown (not swallowed) so build fails loudly if DB is unreachable.

### `app/robots.ts`

```typescript
import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/utils/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
```

---

## 3. JSON-LD Structured Data

### `components/JsonLd.tsx`

Server component. Data is always server-generated (never raw user input).

```tsx
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

### LocalBusiness schema — `app/layout.tsx`

Place inside `<body>`, before `<ToastContainer />`:

```tsx
<JsonLd data={{
  "@context": "https://schema.org",
  "@type": "Bakery",
  "name": "DeliDanis",
  "url": "https://delidanis.cl",
  "telephone": "+56993928764",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "CL",
    "addressLocality": "Chile"
  },
  "servesCuisine": "Pastelería, Tortas, Coctelería",
  "priceRange": "$$",
  "image": "https://delidanis.cl/logo.png"
}} />
```

Note: `openingHours` and exact street address are out of scope — requires business data not currently available.

### Product schema — `/catalogo/[slug]/page.tsx`

Place `<JsonLd>` inside the page JSX (in `<body>` context):

```tsx
<JsonLd data={{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": product.name,
  "description": product.description,
  "image": primaryImage ?? DEFAULT_OG_IMAGE,
  "brand": { "@type": "Brand", "name": "DeliDanis" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "CLP",
    "price": product.base_price,
    "availability": product.is_active
      ? "https://schema.org/InStock"
      : "https://schema.org/Discontinued"
  }
}} />
```

Since `getProductBySlug` calls `notFound()` for inactive products, the `Discontinued` branch will rarely be reached, but it remains for correctness.

---

## 4. Vercel Analytics

### Packages

```bash
npm install @vercel/analytics @vercel/speed-insights
```

### Integration — `app/layout.tsx`

```tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// inside <body>, after <ToastContainer />:
<Analytics />
<SpeedInsights />
```

Both components are no-ops outside Vercel deployments. No conditional rendering needed — environment detection is handled internally by both libraries.

---

## Files to Create

- `lib/utils/seo.ts` — `BASE_URL`, `DEFAULT_OG_IMAGE`, `buildMetadata()`
- `components/JsonLd.tsx` — JSON-LD script component
- `app/sitemap.ts` — sitemap generator
- `app/robots.ts` — robots.txt generator

## Files to Modify

- `lib/supabase/product-queries.ts` — add `getProductBySlug()` and `getActiveProductSlugs()`
- `app/layout.tsx` — add LocalBusiness JSON-LD + Analytics + SpeedInsights
- `app/(public)/page.tsx` — add metadata export
- `app/(public)/catalogo/page.tsx` — add metadata export
- `app/(public)/catalogo/pasteleria/page.tsx` — add metadata export (confirmed to exist)
- `app/(public)/catalogo/cocteleria/page.tsx` — add metadata export (confirmed to exist)
- `app/(public)/catalogo/[slug]/page.tsx` — add generateMetadata + Product JSON-LD (confirmed to exist)
- `app/(public)/agendar/page.tsx` — add metadata export
- `app/(public)/agendar/confirmacion/page.tsx` — add metadata export with noIndex: true (confirmed to exist)
- `app/(public)/nosotros/page.tsx` — add metadata export
- `app/(public)/galeria/page.tsx` — add metadata export
- `app/(public)/contacto/page.tsx` — add metadata export
- `app/(public)/testimonios/page.tsx` — add metadata export
- `app/(public)/seguimiento/page.tsx` — add metadata export (confirmed to exist)
- `app/(public)/seguimiento/[codigo]/page.tsx` — add static metadata export with noIndex: true (confirmed to exist)
