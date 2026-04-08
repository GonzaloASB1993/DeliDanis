import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Contacto | Pide tu Torta Artesanal - DeliDanis',
  description: 'Escríbenos por WhatsApp, email o teléfono. Estamos para ayudarte a planificar la torta perfecta para tu evento. Atención rápida y personalizada en Santiago, Chile.',
  path: '/contacto',
})

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
