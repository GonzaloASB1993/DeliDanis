import { getCakeProducts } from '@/lib/supabase/product-queries'
import { CatalogoClient } from './CatalogoClient'
import { JsonLd } from '@/components/JsonLd'
import { BASE_URL } from '@/lib/utils/seo'

// Revalidate every 60 seconds so admin changes reflect quickly
export const revalidate = 60

export default async function CatalogoPage() {
  const { products } = await getCakeProducts()

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Catálogo de Tortas Artesanales - DeliDanis',
    description: 'Tortas artesanales personalizadas para matrimonios, cumpleaños, quinceañeros y eventos en Santiago, Chile.',
    numberOfItems: products?.length ?? 0,
    itemListElement: (products ?? []).filter(p => p.is_active).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.name,
      url: `${BASE_URL}/catalogo/${p.slug}`,
    })),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: `${BASE_URL}/catalogo` },
    ],
  }

  return (
    <>
      <JsonLd data={itemListSchema} />
      <JsonLd data={breadcrumbSchema} />
      <CatalogoClient initialProducts={products ?? []} />
    </>
  )
}
