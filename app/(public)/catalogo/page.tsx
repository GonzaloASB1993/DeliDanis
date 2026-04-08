import { getCakeProducts } from '@/lib/supabase/product-queries'
import { CatalogoClient } from './CatalogoClient'

export default async function CatalogoPage() {
  const { products } = await getCakeProducts()
  return <CatalogoClient initialProducts={products ?? []} />
}
