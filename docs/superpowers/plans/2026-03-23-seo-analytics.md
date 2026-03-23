# SEO + Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full SEO metadata, sitemap, robots.txt, JSON-LD structured data, and Vercel Analytics to the DeliDanis public site.

**Architecture:** A central `lib/utils/seo.ts` helper produces all metadata objects. Because every public page is a client component (`'use client'`), metadata cannot be exported from page.tsx files directly — instead each route gets a thin `layout.tsx` server component that exports `metadata` and passes children through. The one exception is the home page (server component), which exports metadata directly. The dynamic product page gets a full server wrapper using the same pattern as the existing admin pages. JSON-LD uses a `<JsonLd>` server component. Sitemap and robots use Next.js 14's native conventions.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (anon client), `@vercel/analytics`, `@vercel/speed-insights`

---

## Important Codebase Context

- **All public pages are client components** (`'use client'`), except `app/(public)/page.tsx` (home) — verified by reading file headers.
- `lib/supabase/product-queries.ts` uses a direct `createClient` (anon key) at the top as `supabase` const. **Do NOT import `createServerClient`** — use the existing `supabase` const.
- Product tables are `cake_products`, `pastry_products`, `cocktail_products` — **not** `products`. Only `cake_products` has individual slug-based detail pages.
- `app/(public)/catalogo/[slug]/page.tsx` is a **client component** — Task 6 creates a server wrapper.
- `app/(public)/layout.tsx` exists and is a server component (no `'use client'`).

---

## File Structure

**Files to Create:**
- `lib/utils/seo.ts` — central config + `buildMetadata()` helper
- `components/JsonLd.tsx` — JSON-LD `<script>` server component
- `app/sitemap.ts` — sitemap generator
- `app/robots.ts` — robots.txt generator
- `app/(public)/catalogo/layout.tsx` — metadata for /catalogo (fallback for sub-routes)
- `app/(public)/catalogo/pasteleria/layout.tsx` — metadata for /catalogo/pasteleria
- `app/(public)/catalogo/cocteleria/layout.tsx` — metadata for /catalogo/cocteleria
- `app/(public)/agendar/layout.tsx` — metadata for /agendar
- `app/(public)/agendar/confirmacion/layout.tsx` — metadata + noIndex for /agendar/confirmacion
- `app/(public)/nosotros/layout.tsx` — metadata for /nosotros
- `app/(public)/galeria/layout.tsx` — metadata for /galeria
- `app/(public)/contacto/layout.tsx` — metadata for /contacto
- `app/(public)/testimonios/layout.tsx` — metadata for /testimonios
- `app/(public)/seguimiento/layout.tsx` — metadata for /seguimiento
- `app/(public)/seguimiento/[codigo]/layout.tsx` — metadata + noIndex for /seguimiento/[codigo]
- `app/(public)/catalogo/[slug]/ProductDetailClient.tsx` — extracted client component

**Files to Modify:**
- `lib/supabase/product-queries.ts` — append `getProductBySlug()` and `getActiveProductSlugs()`
- `app/layout.tsx` — add LocalBusiness JSON-LD + Analytics + SpeedInsights
- `app/(public)/page.tsx` — add `metadata` export (server component, can do it directly)
- `app/(public)/catalogo/[slug]/page.tsx` — rewrite as server wrapper with `generateMetadata`

---

## Task 1: Foundational utilities — seo.ts + JsonLd.tsx + packages

**Files:**
- Create: `lib/utils/seo.ts`
- Create: `components/JsonLd.tsx`

- [ ] **Step 1: Install Vercel packages**

```bash
cd "C:\Users\gonza\OneDrive\Escritorio\Proyectos Web\DeliDanis"
npm install @vercel/analytics @vercel/speed-insights
```

Expected: packages added to `package.json`, no errors.

- [ ] **Step 2: Create `lib/utils/seo.ts`**

```typescript
import type { Metadata } from 'next'

export const BASE_URL = 'https://delidanis.cl'
// public/logo.png exists but is a logo — not the ideal 1200x630 OG image.
// Do NOT hardcode width/height — let platforms measure it.
export const DEFAULT_OG_IMAGE = `${BASE_URL}/logo.png`

interface BuildMetadataParams {
  title: string
  description: string
  path: string       // e.g. '/catalogo'
  image?: string     // absolute URL; falls back to DEFAULT_OG_IMAGE
  noIndex?: boolean  // true = robots noindex,nofollow
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  noIndex,
}: BuildMetadataParams): Metadata {
  const url = `${BASE_URL}${path}`
  const ogImage = image ?? DEFAULT_OG_IMAGE
  return {
    metadataBase: new URL(BASE_URL),
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
      images: [{ url: ogImage, alt: title }],
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

- [ ] **Step 3: Create `components/JsonLd.tsx`**

```tsx
// Server component. Data is always server-generated — never raw user input.
// JSON.stringify is safe for structured data objects from our own codebase.
export function JsonLd({ data }: { data: object }) {
  const __html = JSON.stringify(data)
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html }} />
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/seo.ts components/JsonLd.tsx package.json package-lock.json
git commit -m "feat: add seo helper, JsonLd component, and Vercel analytics packages"
```

---

## Task 2: Product query helpers

**Files:**
- Modify: `lib/supabase/product-queries.ts` (append at the end)

- [ ] **Step 1: Append to end of `lib/supabase/product-queries.ts`**

```typescript
/**
 * Slugs of all active cake products — used in sitemap generation.
 * Throws on DB error so build fails loudly.
 */
export async function getActiveProductSlugs(): Promise<{ slug: string }[]> {
  const { data, error } = await supabase
    .from('cake_products')
    .select('slug')
    .eq('is_active', true)
  if (error) throw new Error(`getActiveProductSlugs: ${error.message}`)
  return data ?? []
}

/**
 * Fetches a single cake product by slug for server-side metadata generation.
 * Returns null if not found.
 */
export async function getProductBySlug(slug: string) {
  const { data } = await supabase
    .from('cake_products')
    .select('id, name, slug, description, short_description, base_price, is_active')
    .eq('slug', slug)
    .single()
  return data
}
```

Note: uses the existing `supabase` const already at the top of the file. No new imports needed.

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/product-queries.ts
git commit -m "feat: add getActiveProductSlugs and getProductBySlug to product-queries"
```

---

## Task 3: sitemap.ts + robots.ts

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`

- [ ] **Step 1: Create `app/sitemap.ts`**

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

- [ ] **Step 2: Create `app/robots.ts`**

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

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: succeeds, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add app/sitemap.ts app/robots.ts
git commit -m "feat: add sitemap.xml and robots.txt"
```

---

## Task 4: Root layout — LocalBusiness JSON-LD + Vercel Analytics

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add imports after existing imports in `app/layout.tsx`**

```typescript
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { JsonLd } from '@/components/JsonLd'
```

- [ ] **Step 2: Replace the `<body>` block**

Change:
```tsx
<body className="font-body">
  {children}
  <ToastContainer />
</body>
```

To:
```tsx
<body className="font-body">
  <JsonLd data={{
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: 'DeliDanis',
    url: 'https://delidanis.cl',
    telephone: '+56993928764',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CL',
      addressLocality: 'Chile',
    },
    servesCuisine: 'Pasteleria, Tortas, Cocteleria',
    priceRange: '$$',
    image: 'https://delidanis.cl/logo.png',
  }} />
  {children}
  <ToastContainer />
  <Analytics />
  <SpeedInsights />
</body>
```

- [ ] **Step 3: Build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add LocalBusiness JSON-LD and Vercel Analytics to root layout"
```

---

## Task 5: Metadata for home page (direct export)

`app/(public)/page.tsx` is a server component — metadata can be exported directly from it.

**Files:**
- Modify: `app/(public)/page.tsx`

- [ ] **Step 1: Add import + metadata export after existing imports**

```typescript
import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'DeliDanis - Pasteleria Premium en Chile',
  description: 'Tortas artesanales para matrimonios, quinceaneros y eventos. Disenos unicos, sabores memorables.',
  path: '/',
})
```

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/page.tsx"
git commit -m "feat: add SEO metadata to home page"
```

---

## Task 6: Metadata layout files for all client-component pages

**Context:** All remaining public pages have `'use client'` — metadata cannot be exported from them. Solution: create `layout.tsx` server components per route that export metadata and pass `children` through unchanged. Next.js 14 merges metadata from the nearest layout/page in the hierarchy.

**Files to create** (all are new files — do NOT modify existing pages):

- [ ] **Step 1: Create `app/(public)/catalogo/layout.tsx`**

```tsx
import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Catalogo - DeliDanis',
  description: 'Explora nuestra coleccion de tortas, pasteleria y cocteleria para eventos especiales.',
  path: '/catalogo',
})

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 2: Create `app/(public)/catalogo/pasteleria/layout.tsx`**

```tsx
import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Pasteleria - DeliDanis',
  description: 'Pie de limon, tartas, cheesecakes, alfajores, brownies y dulces finos para matrimonios, cumpleanos y eventos corporativos.',
  path: '/catalogo/pasteleria',
})

export default function PasteleriaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 3: Create `app/(public)/catalogo/cocteleria/layout.tsx`**

```tsx
import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Cocteleria - DeliDanis',
  description: 'Cocteles artesanales, limonadas, mini sandwiches, empanaditas y bocadillos para matrimonios y celebraciones.',
  path: '/catalogo/cocteleria',
})

export default function CocteleriaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 4: Create `app/(public)/agendar/layout.tsx`**

```tsx
import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Agenda tu Pedido - DeliDanis',
  description: 'Reserva tu torta o servicio con anticipacion. Proceso simple, confirmacion inmediata.',
  path: '/agendar',
})

export default function AgendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 5: Create `app/(public)/agendar/confirmacion/layout.tsx`**

```tsx
import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Confirmacion - DeliDanis',
  description: 'Tu pedido ha sido recibido.',
  path: '/agendar/confirmacion',
  noIndex: true,
})

export default function ConfirmacionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 6: Create `app/(public)/nosotros/layout.tsx`**

```tsx
import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Nosotros - DeliDanis',
  description: 'Conoce la historia y el equipo detras de DeliDanis.',
  path: '/nosotros',
})

export default function NosotrosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 7: Create `app/(public)/galeria/layout.tsx`**

```tsx
import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Galeria - DeliDanis',
  description: 'Inspirate con nuestras creaciones: tortas de matrimonio, quinceaneros y mas.',
  path: '/galeria',
})

export default function GaleriaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 8: Create `app/(public)/contacto/layout.tsx`**

```tsx
import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Contacto - DeliDanis',
  description: 'Escribenos, llamanos o visitanos. Estamos para ayudarte a planificar tu evento.',
  path: '/contacto',
})

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 9: Create `app/(public)/testimonios/layout.tsx`**

```tsx
import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Testimonios - DeliDanis',
  description: 'Lo que dicen nuestros clientes sobre sus experiencias con DeliDanis.',
  path: '/testimonios',
})

export default function TestimoniosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 10: Create `app/(public)/seguimiento/layout.tsx`**

```tsx
import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Seguimiento de Pedido - DeliDanis',
  description: 'Consulta el estado de tu pedido en tiempo real.',
  path: '/seguimiento',
})

export default function SeguimientoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 11: Create `app/(public)/seguimiento/[codigo]/layout.tsx`**

```tsx
import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Seguimiento - DeliDanis',
  description: 'Estado de tu pedido.',
  path: '/seguimiento',
  noIndex: true,
})

export default function SeguimientoCodigoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 12: Build**

```bash
npm run build
```

Expected: all pages compile, no TypeScript errors.

- [ ] **Step 13: Commit**

```bash
git add "app/(public)/"
git commit -m "feat: add SEO metadata layout files for all public pages"
```

---

## Task 7: Dynamic metadata + Product JSON-LD for /catalogo/[slug]

**Context:** `app/(public)/catalogo/[slug]/page.tsx` is `'use client'` and cannot export `generateMetadata`. Solution: extract the client component to `ProductDetailClient.tsx`, replace `page.tsx` with a server wrapper.

**Files:**
- Create: `app/(public)/catalogo/[slug]/ProductDetailClient.tsx`
- Rewrite: `app/(public)/catalogo/[slug]/page.tsx`

- [ ] **Step 1: Create `ProductDetailClient.tsx`**

Create `app/(public)/catalogo/[slug]/ProductDetailClient.tsx` with this exact content (it is the current `page.tsx` with two changes: function renamed and `slug` received as prop instead of from `useParams`):

```tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button, Badge } from '@/components/ui'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { formatCurrency } from '@/lib/utils/format'
import { getCakeProducts } from '@/lib/supabase/product-queries'

interface ProductImage {
  id: string
  url: string
  alt_text?: string
  is_primary: boolean
}

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  base_price: number
  min_portions: number
  max_portions: number
  price_per_portion?: number
  preparation_days?: number
  is_customizable?: boolean
  is_featured?: boolean
  category?: { name: string }
  subcategory?: { name: string }
  images?: ProductImage[]
}

export function ProductDetailClient({ slug }: { slug: string }) {
  const router = useRouter()

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Cargar producto
  useEffect(() => {
    async function loadProduct() {
      try {
        const { success, products } = await getCakeProducts()
        if (success) {
          const found = products.find((p: Product) => p.slug === slug)
          if (found) {
            setProduct(found)
          }
        }
      } catch (error) {
        console.error('Error loading product:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProduct()
  }, [slug])

  // Estado de porciones
  const minPortions = product?.min_portions || 15
  const maxPortions = product?.max_portions || 80
  const [portions, setPortions] = useState(minPortions)

  // Actualizar porciones cuando carga el producto
  useEffect(() => {
    if (product) {
      setPortions(product.min_portions || 15)
    }
  }, [product])

  // Calcular precio
  const calculatedPrice = useMemo(() => {
    if (!product) return 0
    const basePrice = product.base_price || 0
    const pricePerPortion = product.price_per_portion || 0
    const extraPortions = Math.max(0, portions - minPortions)
    return basePrice + (extraPortions * pricePerPortion)
  }, [product, portions, minPortions])

  const images = product?.images || []
  const currentImage = images[selectedImageIndex]

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-dark-light text-lg">Cargando producto...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-dark mb-4">Producto no encontrado</h2>
          <p className="text-dark-light mb-6">El producto que buscas no existe o fue eliminado.</p>
          <Link
            href="/catalogo"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors inline-block"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-secondary py-4">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-dark-light hover:text-primary">
              Inicio
            </Link>
            <span className="text-dark-light">/</span>
            <Link href="/catalogo" className="text-dark-light hover:text-primary">
              Catálogo
            </Link>
            <span className="text-dark-light">/</span>
            <span className="text-dark">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-secondary rounded-2xl overflow-hidden relative">
              {currentImage ? (
                <Image
                  src={currentImage.url}
                  alt={currentImage.alt_text || product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-8xl">🎂</div>
                </div>
              )}
              {product.is_featured && (
                <div className="absolute top-4 left-4">
                  <Badge variant="primary">Destacado</Badge>
                </div>
              )}
            </div>
            {/* Thumbnail gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.slice(0, 4).map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      i === selectedImageIndex
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt_text || `${product.name} ${i + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Category badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                Torta
              </span>
              {product.category && (
                <span className="px-3 py-1 bg-secondary text-dark rounded-full text-sm font-medium">
                  {product.category.name}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-dark mb-4">
              {product.name}
            </h1>

            {/* Description */}
            {product.description && (
              <p className="text-dark-light text-lg leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            {/* Portions Selector */}
            <div className="bg-secondary/50 rounded-xl p-5 mb-6">
              <label className="block font-semibold text-dark mb-3">
                Número de Porciones
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPortions(Math.max(minPortions, portions - 5))}
                  disabled={portions <= minPortions}
                  className="w-11 h-11 rounded-full bg-white border border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-colors flex items-center justify-center font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-bold text-dark">{portions}</span>
                  <span className="text-dark-light ml-2">personas</span>
                </div>
                <button
                  onClick={() => setPortions(Math.min(maxPortions, portions + 5))}
                  disabled={portions >= maxPortions}
                  className="w-11 h-11 rounded-full bg-white border border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-colors flex items-center justify-center font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              <p className="text-sm text-dark-light mt-3 text-center">
                Rango: {minPortions} - {maxPortions} porciones
              </p>
            </div>

            {/* Price Box */}
            <div className="bg-secondary rounded-xl p-5 mb-6">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-sm text-dark-light mb-1">Precio total</p>
                  <p className="font-display text-3xl md:text-4xl font-bold text-accent">
                    {formatCurrency(calculatedPrice)}
                  </p>
                </div>
              </div>
              {product.price_per_portion && product.price_per_portion > 0 && (
                <div className="pt-3 border-t border-white/50 text-sm text-dark-light space-y-1">
                  <div className="flex justify-between">
                    <span>Precio base ({minPortions} porciones)</span>
                    <span>{formatCurrency(product.base_price)}</span>
                  </div>
                  {portions > minPortions && (
                    <div className="flex justify-between">
                      <span>+{portions - minPortions} porciones extra</span>
                      <span>+{formatCurrency((portions - minPortions) * product.price_per_portion)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm">
              {product.preparation_days && (
                <div className="flex items-center gap-2 text-dark-light">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{product.preparation_days} días de preparación</span>
                </div>
              )}
              {product.is_customizable && (
                <div className="flex items-center gap-2 text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>100% Personalizable</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/agendar" className="flex-1">
                <Button size="lg" className="w-full">
                  Agendar Pedido
                </Button>
              </Link>
              <a
                href={`https://wa.me/56939282764?text=Hola, me interesa: ${product.name} para ${portions} personas`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Consultar
              </a>
            </div>
          </div>
        </div>
      </div>

      <WhatsAppButton />
    </>
  )
}
```

- [ ] **Step 2: Rewrite `app/(public)/catalogo/[slug]/page.tsx`**

Replace the entire file with:

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { buildMetadata, DEFAULT_OG_IMAGE } from '@/lib/utils/seo'
import { JsonLd } from '@/components/JsonLd'
import { getProductBySlug } from '@/lib/supabase/product-queries'
import { ProductDetailClient } from './ProductDetailClient'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug)
  if (!product || !product.is_active) {
    return buildMetadata({
      title: 'Producto no encontrado - DeliDanis',
      description: 'Este producto no esta disponible.',
      path: `/catalogo/${params.slug}`,
      noIndex: true,
    })
  }
  return buildMetadata({
    title: `${product.name} - DeliDanis`,
    description: product.short_description ?? product.description?.slice(0, 155) ?? '',
    path: `/catalogo/${params.slug}`,
  })
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProductBySlug(params.slug)
  if (!product || !product.is_active) notFound()

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: DEFAULT_OG_IMAGE,
    brand: { '@type': 'Brand', name: 'DeliDanis' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CLP',
      price: product.base_price,
      availability: 'https://schema.org/InStock',
    },
  }

  return (
    <>
      <JsonLd data={productSchema} />
      <ProductDetailClient slug={params.slug} />
    </>
  )
}
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Smoke test**

```bash
npm run dev
```

Visit `http://localhost:3000/catalogo` and click a product — page should load and function identically to before. View page source — confirm `<script type="application/ld+json">` is present.

- [ ] **Step 5: Commit**

```bash
git add "app/(public)/catalogo/[slug]/"
git commit -m "feat: add generateMetadata and Product JSON-LD to product detail page"
```

---

## Final verification

- [ ] **Full build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Check sitemap** — start dev server, visit `http://localhost:3000/sitemap.xml`

Expected: XML with 10+ static routes + product slugs.

- [ ] **Check robots** — visit `http://localhost:3000/robots.txt`

Expected: `Allow: /`, `Disallow: /admin`, `Disallow: /api`, sitemap URL.

- [ ] **Check JSON-LD** — view source of `http://localhost:3000`

Expected: `"@type":"Bakery"` script present.

- [ ] **Update `.claude/task.md`** — mark M10 items as done:

```
- [x] SEO — metadata, Open Graph, sitemap.xml, robots.txt
- [x] Analytics — Google Analytics o Vercel Analytics
```

- [ ] **Final commit**

```bash
git add .claude/task.md
git commit -m "chore: mark SEO and Analytics complete in M10 task tracker"
```
