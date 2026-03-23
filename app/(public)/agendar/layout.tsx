import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Agenda tu Pedido - DeliDanis',
  description: 'Reserva tu torta o servicio con anticipacion. Proceso simple, confirmacion inmediata.',
  path: '/agendar',
})

export default function AgendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
