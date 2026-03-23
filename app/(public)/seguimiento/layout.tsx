import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Seguimiento de Pedido - DeliDanis',
  description: 'Consulta el estado de tu pedido en tiempo real.',
  path: '/seguimiento',
})

export default function SeguimientoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
