import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Coctelería Premium para Matrimonios y Eventos | DeliDanis',
  description: 'Cócteles artesanales, limonadas, mini sándwiches, empanaditas y bocadillos premium para matrimonios, quinceañeros y celebraciones en Santiago, Chile.',
  path: '/catalogo/cocteleria',
})

export default function CocteleriaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
