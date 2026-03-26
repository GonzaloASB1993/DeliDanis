import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Catálogo - DeliDanis',
  description: 'Explora nuestra colección de tortas, pastelería y coctelería para eventos especiales.',
  path: '/catalogo',
})

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
