import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Catálogo de Tortas y Pastelería | DeliDanis Chile',
  description: 'Explora nuestro catálogo de tortas artesanales, pastelería y coctelería para matrimonios, cumpleaños, quinceañeros y todo tipo de eventos especiales en Chile.',
  path: '/catalogo',
})

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
