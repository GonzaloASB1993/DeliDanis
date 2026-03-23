import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/utils/seo'
import { getActiveProductSlugs } from '@/lib/supabase/product-queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Only cake products have individual /catalogo/[slug] detail pages.
  // Pastelería and coctelería category pages are covered by static routes above.
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
