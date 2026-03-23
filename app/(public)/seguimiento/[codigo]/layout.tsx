import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Seguimiento - DeliDanis',
  description: 'Estado de tu pedido.',
  path: '/seguimiento',
  noIndex: true,
})

export default function SeguimientoCodigoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
