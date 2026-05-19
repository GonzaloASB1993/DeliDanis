import { getCakeProducts } from '@/lib/supabase/product-queries'
import { CatalogoClient } from './CatalogoClient'

// Revalidate every 60 seconds so admin changes reflect quickly
export const revalidate = 60

export default async function CatalogoPage() {
  const { products } = await getCakeProducts()
  return <CatalogoClient initialProducts={products ?? []} />
}
