import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Testimonios - DeliDanis',
  description: 'Lo que dicen nuestros clientes sobre sus experiencias con DeliDanis.',
  path: '/testimonios',
})

export default function TestimoniosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
