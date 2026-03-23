import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Confirmacion - DeliDanis',
  description: 'Tu pedido ha sido recibido.',
  path: '/agendar/confirmacion',
  noIndex: true,
})

export default function ConfirmacionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
