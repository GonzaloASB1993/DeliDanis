import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Pastelería Artesanal para Eventos | DeliDanis Chile',
  description: 'Pie de limón, tartas, cheesecakes, alfajores, brownies y dulces finos para matrimonios, cumpleaños y eventos corporativos. Pastelería premium hecha con amor en Santiago.',
  path: '/catalogo/pasteleria',
})

export default function PasteleriaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
