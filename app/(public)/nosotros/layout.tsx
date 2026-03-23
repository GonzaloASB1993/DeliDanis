import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Nosotros - DeliDanis',
  description: 'Conoce la historia y el equipo detras de DeliDanis.',
  path: '/nosotros',
})

export default function NosotrosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
