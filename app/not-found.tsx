import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página no encontrada | DeliDanis',
  description: 'La página que buscas no existe o fue movida.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-light-alt px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-display font-bold text-primary mb-4">404</p>
        <h1 className="text-2xl font-display font-semibold text-dark mb-3">
          Página no encontrada
        </h1>
        <p className="text-dark-light mb-8">
          La página que buscas no existe o fue movida. Te invitamos a explorar nuestro catálogo de tortas artesanales.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-full font-semibold transition-colors"
          >
            Ir al inicio
          </Link>
          <Link
            href="/catalogo"
            className="inline-flex items-center justify-center gap-2 border-2 border-dark text-dark hover:bg-dark hover:text-white px-6 py-3 rounded-full font-semibold transition-colors"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    </div>
  )
}
