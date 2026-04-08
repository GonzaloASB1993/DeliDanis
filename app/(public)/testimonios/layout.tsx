import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Testimonios de Clientes | Tortas DeliDanis Chile',
  description: 'Lee lo que dicen nuestros clientes sobre sus tortas y experiencias con DeliDanis. Matrimonios, quinceañeros y cumpleaños felices en Santiago y toda Chile.',
  path: '/testimonios',
})

export default function TestimoniosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
