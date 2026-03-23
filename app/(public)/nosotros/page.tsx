'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '@/components/ui/Button'

// Registrar plugin de GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function NosotrosPage() {
  const heroRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    // Animación del hero
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      tl.from(titleRef.current, {
        y: 60,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })
        .from(
          subtitleRef.current,
          {
            y: 40,
            opacity: 0,
            duration: 0.6,
            ease: 'power3.out',
          },
          '-=0.4'
        )
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <div className="min-h-screen bg-light-alt">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative bg-gradient-to-br from-primary/10 via-secondary to-accent/10 py-16 md:py-20 overflow-hidden"
      >
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary/30 rounded-full" />
            <div className="absolute top-20 right-20 w-32 h-32 border-2 border-accent/30 rounded-full" />
            <div className="absolute bottom-20 left-1/4 w-24 h-24 border-2 border-primary/30 rounded-full" />
            <div className="absolute bottom-10 right-1/3 w-16 h-16 border-2 border-accent/30 rounded-full" />
          </div>
        </div>

        {/* Gradient Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/15 rounded-full blur-2xl" />
        </div>

        <div className="relative container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-primary font-medium mb-6 shadow-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              Conoce nuestra historia
            </div>

            <h1
              ref={titleRef}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-dark mb-6"
            >
              Sobre <span className="text-primary">Nosotros</span>
            </h1>
            <p
              ref={subtitleRef}
              className="text-lg md:text-xl text-dark-light leading-relaxed max-w-2xl mx-auto"
            >
              Una historia de amor, pasión y deliciosas creaciones
            </p>
          </div>
        </div>
      </section>

      {/* Historia Principal */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Imagen */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/Delidanis.jpg"
                  alt="Danitza - Fundadora de DeliDanis"
                  width={600}
                  height={800}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
              {/* Decoración */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl -z-10" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-accent/20 rounded-full blur-2xl -z-10" />
            </div>

            {/* Historia */}
            <div className="space-y-6">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-dark">
                Hola, soy <span className="text-primary">Danitza</span> 👋
              </h2>

              <div className="space-y-4 text-dark-light leading-relaxed">
                <p>
                  Mi historia comienza en <strong className="text-dark">Antofagasta</strong>,
                  donde nací y crecí. Pero el amor me trajo hasta Santiago, y con él,
                  una nueva vida llena de aventuras que nunca imaginé.
                </p>

                <p>
                  Dejé todo atrás: mi ciudad, mi trabajo, mi zona de confort. Me lancé
                  a lo desconocido porque creí en algo más grande. Me casé, formé una
                  familia hermosa con mis dos hijas, y durante años me dediqué en cuerpo
                  y alma a verlas crecer.
                </p>

                <p className="text-lg font-medium text-dark italic border-l-4 border-primary pl-4">
                  "Pero la vida tiene formas curiosas de recordarte quién eres..."
                </p>

                <p>
                  Un día, mientras horneaba para mi familia, algo hizo <em>click</em>.
                  Recordé a esa niña que soñaba con ser chef, que miraba fascinada los
                  programas de cocina. Esa pasión que creía perdida estaba ahí,
                  esperándome todo este tiempo.
                </p>

                <p>
                  Decidí dar el paso y me inscribí en{' '}
                  <strong className="text-dark">Barceló</strong> para hacer un curso de
                  pastelería. Y ahí fue cuando todo cambió.
                </p>

                <div className="bg-accent/5 border-l-4 border-accent p-4 rounded-r-lg">
                  <p className="text-dark-light italic">
                    <strong className="text-dark not-italic">Confesión divertida:</strong>{' '}
                    Mis primeros pie de limón fueron un desastre total 😅 La masa quedó
                    cruda y pensé "bueno, quizás esto no es lo mío". Pero no me rendí.
                    Practiqué, ajusté, volví a intentar... y hoy el pie de limón es una
                    de mis especialidades favoritas. ¡Las derrotas más dulces terminan
                    siendo las mejores recetas!
                  </p>
                </div>

                <p>
                  Descubrí que no solo me gustaba...{' '}
                  <strong className="text-primary">¡me encantaba!</strong> Cada técnica
                  nueva, cada decoración, cada sonrisa al probar mis creaciones me
                  confirmaba que había encontrado mi camino.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* El Presente */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-secondary via-white to-secondary">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-dark mb-4">
              De mi cocina a tu celebración 🎂
            </h2>
            <p className="text-lg text-dark-light">
              Lo que comenzó haciendo tortas para la familia y vecinos del condominio
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
            <div className="space-y-6 text-dark-light leading-relaxed">
              <p>
                Cada torta que salía de mi cocina llevaba algo más que ingredientes:
                llevaba amor, dedicación y la ilusión de hacer feliz a alguien. Los
                cumpleaños de mis hijas se convirtieron en mis primeras "clientas".
              </p>

              <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                <p className="text-dark font-medium mb-2">💕 El mejor premio:</p>
                <p className="text-dark-light italic">
                  "Maite, mi hija, ama mis tortas. Verla feliz cuando prueba algo nuevo
                  que horneé es la motivación más grande que tengo. Si ella está feliz,
                  sé que voy por buen camino."
                </p>
              </div>

              <p>
                Pronto los vecinos empezaron a pedirme tortas. "¿Me harías una para
                el cumpleaños de mi hijo?", "¿Podrías hacer algo para nuestro
                aniversario?". Y con cada pedido, mi confianza crecía.
              </p>

              <p className="text-lg font-semibold text-dark">
                Hoy, DeliDanis es mi forma de compartir esta pasión con más personas.
              </p>

              <p>
                No solo horneo tortas, creo <strong className="text-primary">experiencias
                dulces</strong> para tus momentos especiales. Cada pedido es único,
                personalizado, hecho con el mismo cariño —y los mismos estándares— con
                los que horneo para mi propia familia.
              </p>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-dark/5">
                <p className="text-sm font-medium text-dark mb-2">🎂 Mis favoritas:</p>
                <p className="text-dark-light text-sm">
                  Si tengo que elegir, las <strong className="text-primary">Tres Leches</strong> y
                  la <strong className="text-primary">Torta Amor</strong> tienen un lugar especial
                  en mi corazón. Son las que más disfruto preparar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-dark mb-4">
              Lo que me define
            </h2>
            <p className="text-lg text-dark-light">
              Más que recetas, son valores que guían cada creación
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Pasión */}
            <div className="bg-gradient-to-br from-primary/5 to-transparent p-8 rounded-2xl border border-primary/10 hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-4xl">❤️</span>
              </div>
              <h3 className="font-display text-xl font-bold text-dark text-center mb-3">
                Amor en cada capa
              </h3>
              <p className="text-dark-light text-center">
                Cada torta es hecha con el mismo amor con el que horneo para mis hijas.
                No es solo un trabajo, es poner mi corazón en tu celebración.
              </p>
            </div>

            {/* Calidad */}
            <div className="bg-gradient-to-br from-accent/5 to-transparent p-8 rounded-2xl border border-accent/10 hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-4xl">✨</span>
              </div>
              <h3 className="font-display text-xl font-bold text-dark text-center mb-3">
                Mi secreto
              </h3>
              <p className="text-dark-light text-center">
                Ingredientes de buena calidad, harto relleno, y un estándar simple:
                hago cada torta como si fuera para mí. Si no me gusta, no sale de mi cocina.
              </p>
            </div>

            {/* Protagonismo */}
            <div className="bg-gradient-to-br from-primary/5 to-transparent p-8 rounded-2xl border border-primary/10 hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-4xl">🎉</span>
              </div>
              <h3 className="font-display text-xl font-bold text-dark text-center mb-3">
                Protagonista de tu fiesta
              </h3>
              <p className="text-dark-light text-center">
                Mi sueño es que mi torta sea la protagonista de tu celebración, que la
                gente la disfrute y diga "¡wow, esto está increíble!"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mi Sueño */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="bg-gradient-to-br from-accent/10 via-primary/5 to-transparent rounded-2xl p-8 md:p-12 border border-accent/20">
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
              <span className="text-5xl">☕</span>
              <div>
                <h3 className="font-display text-2xl font-bold text-dark mb-3">
                  El sueño que viene...
                </h3>
                <p className="text-dark-light leading-relaxed">
                  Mientras sigo creando tortas que hagan feliz a la gente, tengo un sueño
                  guardado en el corazón: <strong className="text-primary">algún día tener
                  mi propia cafetería</strong>. Un lugar acogedor donde las personas puedan
                  probar mis creaciones, tomar un café y llevarse un pedacito de felicidad
                  a casa. Paso a paso, con paciencia y amor, sé que llegaré ahí.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/10 via-secondary to-accent/10">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-dark mb-6">
              ¿Lista para que tu torta sea la protagonista?
            </h2>
            <p className="text-lg text-dark-light mb-8 max-w-2xl mx-auto">
              Me encantaría ser parte de tu celebración. Conversemos sobre esa
              torta que tienes en mente y hagámosla realidad juntas. Con amor,
              ingredientes de calidad y harto relleno 😊
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/agendar">
                <Button size="lg" className="w-full sm:w-auto">
                  Haz tu pedido
                </Button>
              </Link>
              <Link href="/catalogo">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Ver sabores
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-dark-light">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span className="text-sm">
                ¿Prefieres escribirme? Visita nuestra página de{' '}
                <Link href="/contacto" className="text-primary hover:underline font-medium">
                  contacto
                </Link>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
