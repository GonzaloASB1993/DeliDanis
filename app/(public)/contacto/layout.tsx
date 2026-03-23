import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Contacto - DeliDanis',
  description: 'Escribenos, llamanos o visitanos. Estamos para ayudarte a planificar tu evento.',
  path: '/contacto',
})

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
