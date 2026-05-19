import type { Metadata } from 'next'

export const BASE_URL = 'https://delidanis.cl'
// Next.js auto-generates /opengraph-image from app/opengraph-image.tsx (1200x630)
// This fallback is used when no per-page OG image route exists.
export const DEFAULT_OG_IMAGE = `${BASE_URL}/opengraph-image`

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
      images: [{ url: ogImage, alt: title, width: 1200, height: 630 }],
      locale: 'es_CL',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@delidanis_pasteleria',
      title,
      description,
      images: [ogImage],
    },
  }
}
