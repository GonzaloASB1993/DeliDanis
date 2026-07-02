import { Hero } from '@/components/public/Hero'
import { FeaturedProducts } from '@/components/public/FeaturedProducts'
import { ServicesSection } from '@/components/public/ServicesSection'
import { TestimonialsCarousel } from '@/components/public/TestimonialsCarousel'
import { CTASection } from '@/components/public/CTASection'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { MobileActionBar } from '@/components/public/MobileActionBar'
import { JsonLd } from '@/components/JsonLd'
import { buildMetadata } from '@/lib/utils/seo'

export const metadata = buildMetadata({
  title: 'Tortas Artesanales y Pastelería Premium en Santiago, Chile',
  description: 'Tortas personalizadas para matrimonios, cumpleaños, quinceañeros y eventos en Santiago. Pastelería artesanal, coctelería gourmet y servicio de catering. Cotiza sin compromiso.',
  path: '/',
})

export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'DeliDanis',
        url: 'https://delidanis.cl',
        description: 'Pastelería artesanal premium en Santiago, Chile. Tortas personalizadas, coctelería y catering para eventos.',
        publisher: {
          '@type': 'Organization',
          name: 'DeliDanis',
          logo: { '@type': 'ImageObject', url: 'https://delidanis.cl/logo.png' },
        },
      }} />

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

      {/* Barra de acción fija mobile - Cotizar + WhatsApp siempre a mano */}
      <MobileActionBar />
    </main>
  )
}
