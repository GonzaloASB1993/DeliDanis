import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ContactForm } from '@/components/public/ContactForm'
import { ContactInfo } from '@/components/public/ContactInfo'
import { JsonLd } from '@/components/JsonLd'

async function getDeliveryCost(): Promise<number | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'payments')
      .single()
    return data?.value?.delivery_cost ?? null
  } catch {
    return null
  }
}

export default async function ContactoPage() {
  const deliveryCost = await getDeliveryCost()

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Con cuánta anticipación debo hacer mi pedido?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Recomendamos hacer los pedidos con al menos 5 días de anticipación para garantizar disponibilidad y la mejor calidad en tu torta. Para eventos especiales o pedidos grandes, se sugiere contactarnos con 2 semanas de anticipación.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Hacen entregas a domicilio?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Sí, realizamos entregas a domicilio dentro de la ciudad.${deliveryCost && deliveryCost > 0 ? ` El costo de envío es de $${deliveryCost.toLocaleString('es-CL')}.` : ' El costo de envío varía según la distancia.'} También puedes optar por retirar tu pedido en nuestra tienda sin costo adicional.`,
        },
      },
      {
        '@type': 'Question',
        name: '¿Puedo personalizar mi torta?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '¡Por supuesto! Todas nuestras tortas son personalizables. Puedes elegir sabores, rellenos, decoraciones y tamaños. Si tienes un diseño específico en mente, envíanos una foto de referencia y haremos nuestro mejor esfuerzo para recrearlo.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué formas de pago aceptan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Aceptamos transferencias bancarias, efectivo y pagos con tarjeta de crédito o débito. Para confirmar tu pedido, solicitamos una seña del 50% del valor total.',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-light-alt">
      <JsonLd data={faqSchema} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-secondary to-accent/10 py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary/30 rounded-full" />
            <div className="absolute top-20 right-20 w-32 h-32 border-2 border-accent/30 rounded-full" />
            <div className="absolute bottom-20 left-1/4 w-24 h-24 border-2 border-primary/30 rounded-full" />
            <div className="absolute bottom-10 right-1/3 w-16 h-16 border-2 border-accent/30 rounded-full" />
          </div>
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/15 rounded-full blur-2xl" />
        </div>

        <div className="relative container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-primary font-medium mb-6 shadow-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Estamos aquí para ayudarte
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-dark mb-6">
              Contáctanos
            </h1>
            <p className="text-lg md:text-xl text-dark-light leading-relaxed max-w-2xl mx-auto">
              Estamos aquí para hacer realidad la torta de tus sueños.
              Escríbenos y te responderemos a la brevedad.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <a
                href="https://wa.me/56939282764"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full text-dark-light hover:text-[#25D366] hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </a>
              <a
                href="mailto:contacto@delidanis.cl"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full text-dark-light hover:text-primary hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </a>
              <a
                href="tel:+56939282764"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full text-dark-light hover:text-primary hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Llamar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            <div className="flex">
              <ContactForm />
            </div>
            <div className="flex">
              <ContactInfo />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-dark mb-6">
              ¿Prefieres hablar directamente?
            </h2>
            <p className="text-lg text-dark-light mb-8">
              Contáctanos por WhatsApp y te atenderemos de inmediato
            </p>
            <a
              href="https://wa.me/56939282764?text=Hola!%20Me%20gustar%C3%ADa%20obtener%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20tortas."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Chatear por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-dark text-center mb-12">
            Preguntas frecuentes
          </h2>

          <div className="space-y-6">
            <details className="group bg-secondary rounded-xl p-6 cursor-pointer">
              <summary className="flex justify-between items-center font-semibold text-dark list-none">
                <span>¿Con cuánta anticipación debo hacer mi pedido?</span>
                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-dark-light">
                Recomendamos hacer los pedidos con al menos 5 días de anticipación
                para garantizar disponibilidad y la mejor calidad en tu torta. Para
                eventos especiales o pedidos grandes, se sugiere contactarnos con
                2 semanas de anticipación.
              </p>
            </details>

            <details className="group bg-secondary rounded-xl p-6 cursor-pointer">
              <summary className="flex justify-between items-center font-semibold text-dark list-none">
                <span>¿Hacen entregas a domicilio?</span>
                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-dark-light">
                Sí, realizamos entregas a domicilio dentro de la ciudad.
                {deliveryCost !== null && deliveryCost > 0
                  ? ` El costo de envío es de $${deliveryCost.toLocaleString('es-CL')}.`
                  : ' El costo de envío varía según la distancia.'}
                {' '}También puedes optar por retirar tu pedido en nuestra tienda sin costo adicional.
              </p>
            </details>

            <details className="group bg-secondary rounded-xl p-6 cursor-pointer">
              <summary className="flex justify-between items-center font-semibold text-dark list-none">
                <span>¿Puedo personalizar mi torta?</span>
                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-dark-light">
                ¡Por supuesto! Todas nuestras tortas son personalizables. Puedes
                elegir sabores, rellenos, decoraciones y tamaños. Si tienes un
                diseño específico en mente, envíanos una foto de referencia y
                haremos nuestro mejor esfuerzo para recrearlo.
              </p>
            </details>

            <details className="group bg-secondary rounded-xl p-6 cursor-pointer">
              <summary className="flex justify-between items-center font-semibold text-dark list-none">
                <span>¿Qué formas de pago aceptan?</span>
                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-dark-light">
                Aceptamos transferencias bancarias, efectivo y pagos con tarjeta
                de crédito o débito. Para confirmar tu pedido, solicitamos una
                seña del 50% del valor total.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
