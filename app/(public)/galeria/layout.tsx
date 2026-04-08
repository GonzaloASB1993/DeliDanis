import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Galería de Tortas Artesanales | DeliDanis Chile',
  description: 'Inspírate con nuestras creaciones: tortas de matrimonio, quinceañeros, cumpleaños y más. Diseños únicos y personalizados hechos con ingredientes premium en Santiago.',
  path: '/galeria',
})

export default function GaleriaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
