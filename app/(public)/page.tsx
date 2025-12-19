import { Hero } from '@/components/public/Hero'
import { FeaturedProducts } from '@/components/public/FeaturedProducts'
import { ServicesSection } from '@/components/public/ServicesSection'
import { TestimonialsCarousel } from '@/components/public/TestimonialsCarousel'
import { CTASection } from '@/components/public/CTASection'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'

export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
      {/* Hero - Primera impresión impactante */}
      <Hero />

      {/* Productos destacados - Mostrar lo mejor */}
      <FeaturedProducts />

      {/* Servicios - Todo lo que ofrecemos */}
      <ServicesSection />

      {/* Testimonios - Prueba social */}
      <TestimonialsCarousel />

      {/* CTA Final - Llamado a la acción */}
      <CTASection />

      {/* WhatsApp flotante */}
      <WhatsAppButton />
    </main>
  )
}
