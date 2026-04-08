import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Nuestra Historia | Pastelería Artesanal DeliDanis Santiago',
  description: 'Conoce a Danitza, la pastelera detrás de DeliDanis. Una historia de pasión, amor por la repostería y el sueño de endulzar cada celebración en Santiago, Chile.',
  path: '/nosotros',
})

export default function NosotrosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
