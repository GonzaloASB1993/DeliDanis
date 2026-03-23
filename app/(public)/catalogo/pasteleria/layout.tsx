import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Pasteleria - DeliDanis',
  description: 'Pie de limon, tartas, cheesecakes, alfajores, brownies y dulces finos para matrimonios, cumpleanos y eventos corporativos.',
  path: '/catalogo/pasteleria',
})

export default function PasteleriaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
