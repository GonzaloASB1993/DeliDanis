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
