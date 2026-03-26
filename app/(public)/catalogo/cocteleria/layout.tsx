import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Coctelería - DeliDanis',
  description: 'Cócteles artesanales, limonadas, mini sandwiches, empanaditas y bocadillos para matrimonios y celebraciones.',
  path: '/catalogo/cocteleria',
})

export default function CocteleriaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
