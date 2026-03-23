import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Catalogo - DeliDanis',
  description: 'Explora nuestra coleccion de tortas, pasteleria y cocteleria para eventos especiales.',
  path: '/catalogo',
})

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
