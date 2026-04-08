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
  const productImage = product.images?.find(img => img.is_primary)?.url
    ?? product.images?.[0]?.url

  return buildMetadata({
    title: `${product.name} - Torta Artesanal | DeliDanis`,
    description: product.short_description ?? product.description?.slice(0, 155) ?? '',
    path: `/catalogo/${params.slug}`,
    image: productImage,
  })
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProductBySlug(params.slug)
  if (!product || !product.is_active) notFound()

  const primaryImage = product.images?.find(img => img.is_primary)?.url
    ?? product.images?.[0]?.url
    ?? DEFAULT_OG_IMAGE

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: primaryImage,
    brand: { '@type': 'Brand', name: 'DeliDanis' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CLP',
      price: product.base_price,
      availability: 'https://schema.org/InStock',
      url: `https://delidanis.cl/catalogo/${product.slug}`,
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://delidanis.cl' },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: 'https://delidanis.cl/catalogo' },
      { '@type': 'ListItem', position: 3, name: product.name, item: `https://delidanis.cl/catalogo/${product.slug}` },
    ],
  }

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <ProductDetailClient slug={params.slug} />
    </>
  )
}
