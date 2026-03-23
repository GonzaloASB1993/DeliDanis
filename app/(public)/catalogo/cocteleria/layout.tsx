import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Cocteleria - DeliDanis',
  description: 'Cocteles artesanales, limonadas, mini sandwiches, empanaditas y bocadillos para matrimonios y celebraciones.',
  path: '/catalogo/cocteleria',
})

export default function CocteleriaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
