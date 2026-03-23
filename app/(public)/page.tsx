import { Hero } from '@/components/public/Hero'
import { FeaturedProducts } from '@/components/public/FeaturedProducts'
import { ServicesSection } from '@/components/public/ServicesSection'
import { TestimonialsCarousel } from '@/components/public/TestimonialsCarousel'
import { CTASection } from '@/components/public/CTASection'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'DeliDanis - Pasteleria Premium en Chile',
  description: 'Tortas artesanales para matrimonios, quinceaneros y eventos. Disenos unicos, sabores memorables.',
  path: '/',
})

export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
      {/* Hero - Impacto inmediato con valor y confianza */}
      <Hero />

      {/* Productos destacados - Mostrar lo mejor */}
      <FeaturedProducts />

      {/* Servicios - Diversidad de opciones */}
      <ServicesSection />

      {/* Testimonios - Prueba social y credibilidad */}
      <TestimonialsCarousel />

      {/* CTA Final - Conversión con urgencia */}
      <CTASection />

      {/* WhatsApp flotante - Acceso rápido a contacto */}
      <WhatsAppButton />
    </main>
  )
}
