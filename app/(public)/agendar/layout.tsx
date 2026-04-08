import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Agendar Pedido de Torta Artesanal | DeliDanis',
  description: 'Reserva tu torta personalizada en minutos. Elige fecha, personaliza tu pedido y paga tu seña de forma segura. Despacho a Santiago y retiro en tienda disponible.',
  path: '/agendar',
})

export default function AgendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
