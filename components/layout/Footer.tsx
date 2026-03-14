import Link from 'next/link'
import Image from 'next/image'

const navigation = {
  productos: [
    { name: 'Catalogo Completo', href: '/catalogo' },
    { name: 'Cocteleria Premium', href: '/catalogo/cocteleria' },
    { name: 'Pasteleria Artesanal', href: '/catalogo/pasteleria' },
  ],
  empresa: [
    { name: 'Nuestra Historia', href: '/nosotros' },
    { name: 'Galeria', href: '/galeria' },
    { name: 'Testimonios', href: '/#testimonios' },
    { name: 'Preguntas Frecuentes', href: '/faq' },
  ],
  servicios: [
    { name: 'Agendar Pedido', href: '/agendar' },
    { name: 'Cotizacion Personalizada', href: '/cotizar' },
    { name: 'Seguimiento de Pedido', href: '/seguimiento' },
    { name: 'Contacto', href: '/contacto' },
  ],
  legal: [
    { name: 'Terminos y Condiciones', href: '/terminos' },
    { name: 'Politica de Privacidad', href: '/privacidad' },
    { name: 'Politica de Devoluciones', href: '/devoluciones' },
  ],
}

const socialLinks = [
  {
    name: 'Instagram',
    href: 'https://instagram.com/delidanis_pasteleria',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com/delidanis',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    name: 'WhatsApp',
    href: 'https://wa.me/56939282764',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com/@delidanis',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
]

const contactInfo = [
  {
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    label: '+56 9 3928 2764',
    href: 'tel:+56939282764',
  },
  {
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    label: 'contacto@delidanis.cl',
    href: 'mailto:contacto@delidanis.cl',
  },
  {
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: 'Santiago, Chile',
    href: 'https://goo.gl/maps',
  },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#2B2B2B] text-light relative overflow-hidden">
      {/* Decorative top line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Subtle background glow */}
      <div className="absolute top-0 right-[15%] w-[300px] h-[300px] bg-primary/[0.04] rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Main Content */}
        <div className="pt-16 pb-12 lg:pt-20 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

            {/* Brand Section */}
            <div className="lg:col-span-4">
              <Link href="/" className="inline-block group mb-7">
                <div className="relative h-20 lg:h-24 w-auto transition-all duration-300 group-hover:opacity-80">
                  <Image
                    src="/logo.png"
                    alt="DeliDanis - Pasteleria Artesanal Premium"
                    width={320}
                    height={96}
                    className="h-full w-auto object-contain filter brightness-0 invert opacity-90"
                  />
                </div>
              </Link>

              <p className="font-accent text-lg text-primary-light/80 mb-5 italic">
                Creaciones unicas para momentos inolvidables
              </p>

              <p className="text-light/55 text-[15px] leading-relaxed mb-8 max-w-sm">
                Pasteleria artesanal premium especializada en eventos especiales.
                Cada creacion es elaborada con dedicacion y los ingredientes mas finos.
              </p>

              {/* Contact Info */}
              <div className="space-y-3 mb-8">
                {contactInfo.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-3 text-light/60 hover:text-primary-light transition-colors duration-300 group"
                  >
                    <span className="flex-shrink-0 w-9 h-9 rounded-full bg-light/[0.05] border border-light/[0.08] flex items-center justify-center group-hover:bg-primary/15 group-hover:border-primary/25 transition-all duration-300">
                      {item.icon}
                    </span>
                    <span className="text-sm">{item.label}</span>
                  </a>
                ))}
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-2.5">
                {socialLinks.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-light/[0.04] rounded-full flex items-center justify-center hover:bg-primary/20 transition-all duration-300 border border-light/[0.06] hover:border-primary/30 text-light/50 hover:text-primary-light"
                    aria-label={`Siguenos en ${item.name}`}
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation Grid */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-6">
                {/* Productos */}
                <div>
                  <h4 className="font-display text-white text-[15px] font-semibold mb-5 relative inline-block">
                    Productos
                    <span className="absolute -bottom-1.5 left-0 w-8 h-px bg-primary/60"></span>
                  </h4>
                  <ul className="space-y-3">
                    {navigation.productos.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-light/55 hover:text-white text-sm transition-colors duration-300 inline-block"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Empresa */}
                <div>
                  <h4 className="font-display text-white text-[15px] font-semibold mb-5 relative inline-block">
                    Empresa
                    <span className="absolute -bottom-1.5 left-0 w-8 h-px bg-primary/60"></span>
                  </h4>
                  <ul className="space-y-3">
                    {navigation.empresa.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-light/55 hover:text-white text-sm transition-colors duration-300 inline-block"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Servicios */}
                <div>
                  <h4 className="font-display text-white text-[15px] font-semibold mb-5 relative inline-block">
                    Servicios
                    <span className="absolute -bottom-1.5 left-0 w-8 h-px bg-primary/60"></span>
                  </h4>
                  <ul className="space-y-3">
                    {navigation.servicios.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-light/55 hover:text-white text-sm transition-colors duration-300 inline-block"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Legal */}
                <div>
                  <h4 className="font-display text-white text-[15px] font-semibold mb-5 relative inline-block">
                    Legal
                    <span className="absolute -bottom-1.5 left-0 w-8 h-px bg-primary/60"></span>
                  </h4>
                  <ul className="space-y-3">
                    {navigation.legal.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-light/55 hover:text-white text-sm transition-colors duration-300 inline-block"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Newsletter */}
              <div className="mt-12 pt-8 border-t border-light/[0.06]">
                <div className="max-w-md">
                  <h4 className="font-display text-white text-base font-semibold mb-2">
                    Suscribete a nuestra newsletter
                  </h4>
                  <p className="text-light/50 text-sm mb-4">
                    Recibe ofertas exclusivas y nuevos disenos
                  </p>
                  <form className="flex gap-2.5">
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      className="flex-1 px-4 py-2.5 rounded-full bg-light/[0.05] border border-light/[0.08] text-white placeholder:text-light/35 focus:outline-none focus:border-primary/40 transition-colors duration-300 text-sm"
                    />
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors duration-300 whitespace-nowrap"
                    >
                      Suscribirme
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-light/[0.06] py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-light/40 text-sm">
              {currentYear} <span className="font-display font-semibold text-light/60">DeliDanis</span>. Todos los derechos reservados.
            </p>

            <div className="flex items-center gap-3">
              <span className="text-light/30 text-xs uppercase tracking-wider">Pagos seguros</span>
              <div className="flex items-center gap-2">
                <div className="bg-white/90 rounded-md px-2 py-1 text-[10px] font-bold text-dark">VISA</div>
                <div className="bg-white/90 rounded-md px-2 py-1 text-[10px] font-bold text-dark">MC</div>
                <div className="bg-primary rounded-md px-2 py-1 text-[10px] font-bold text-white">MP</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
