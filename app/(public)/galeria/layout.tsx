import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Galeria - DeliDanis',
  description: 'Inspirate con nuestras creaciones: tortas de matrimonio, quinceaneros y mas.',
  path: '/galeria',
})

export default function GaleriaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
