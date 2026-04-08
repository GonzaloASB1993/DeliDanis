import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { buildMetadata, DEFAULT_OG_IMAGE } from '@/lib/utils/seo'
import { JsonLd } from '@/components/JsonLd'
import { getProductBySlug } from '@/lib/supabase/product-queries'
import { createClient } from '@supabase/supabase-js'
import { ProductDetailClient } from './ProductDetailClient'

interface Props {
  params: { slug: string }
}

async function getProductPrimaryImage(productId: string): Promise<string | undefined> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data } = await supabase
    .from('product_images')
    .select('url, is_primary')
    .eq('product_id', productId)
    .eq('product_type', 'cake')
    .order('is_primary', { ascending: false })
    .order('order_index')
    .limit(1)
    .single()
  return data?.url ?? undefined
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
    title: `${product.name} - Torta Artesanal | DeliDanis`,
    description: product.short_description ?? product.description?.slice(0, 155) ?? '',
    path: `/catalogo/${params.slug}`,
  })
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProductBySlug(params.slug)
  if (!product || !product.is_active) notFound()

  const primaryImage = await getProductPrimaryImage(product.id) ?? DEFAULT_OG_IMAGE

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
