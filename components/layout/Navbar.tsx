'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { MobileMenu } from './MobileMenu'

interface NavigationItem {
  name: string
  href: string
  submenu?: { name: string; href: string; description?: string }[]
}

const navigation: NavigationItem[] = [
  { name: 'Inicio', href: '/' },
  {
    name: 'Catálogo',
    href: '/catalogo',
    submenu: [
      { name: 'Tortas', href: '/catalogo', description: 'Tortas personalizadas para tu evento' },
      { name: 'Coctelería', href: '/catalogo/cocteleria', description: 'Delicias para cocktails y recepciones' },
      { name: 'Pastelería', href: '/catalogo/pasteleria', description: 'Postres y dulces artesanales' },
    ],
  },
  { name: 'Nosotros', href: '/nosotros' },
  { name: 'Galería', href: '/galería' },
  { name: 'Testimonios', href: '/testimonios' },
  { name: 'Contacto', href: '/contacto' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const pathname = usePathname()

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 10)
  }, [])

  useEffect(() => {
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out',
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_20px_rgba(61,61,61,0.08)] py-2'
            : 'bg-white/80 backdrop-blur-sm py-4'
        )}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className={cn(
                'relative transition-all duration-500 ease-out flex-shrink-0',
                isScrolled ? 'h-12 md:h-14' : 'h-14 md:h-[72px]'
              )}
            >
              <Image
                src="/logo.png"
                alt="DeliDanis"
                width={240}
                height={80}
                className="h-full w-auto object-contain"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => item.submenu && setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {item.submenu ? (
                    <>
                      <button
                        className={cn(
                          'px-4 py-2 rounded-full text-[15px] font-medium transition-all duration-300 relative flex items-center gap-1.5',
                          pathname.startsWith('/catalogo')
                            ? 'text-primary'
                            : 'text-dark/80 hover:text-dark hover:bg-secondary/60'
                        )}
                      >
                        {item.name}
                        <svg
                          className={cn(
                            'w-3.5 h-3.5 transition-transform duration-300',
                            activeDropdown === item.name ? 'rotate-180' : ''
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {pathname.startsWith('/catalogo') && (
                          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                        )}
                      </button>

                      {/* Dropdown Menu */}
                      <div
                        className={cn(
                          'absolute top-full left-1/2 -translate-x-1/2 pt-3 transition-all duration-300',
                          activeDropdown === item.name
                            ? 'opacity-100 translate-y-0 pointer-events-auto'
                            : 'opacity-0 -translate-y-2 pointer-events-none'
                        )}
                      >
                        <div className="w-64 bg-white rounded-2xl shadow-lg border border-border/50 overflow-hidden p-2">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={cn(
                                'block px-4 py-3 rounded-xl text-sm transition-all duration-200',
                                pathname === subItem.href
                                  ? 'bg-primary/8 text-primary'
                                  : 'text-dark hover:bg-secondary/80'
                              )}
                            >
                              <span className="font-semibold block">{subItem.name}</span>
                              {subItem.description && (
                                <span className="text-dark-light text-xs mt-0.5 block">{subItem.description}</span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'px-4 py-2 rounded-full text-[15px] font-medium transition-all duration-300 relative',
                        pathname === item.href
                          ? 'text-primary'
                          : 'text-dark/80 hover:text-dark hover:bg-secondary/60'
                      )}
                    >
                      {item.name}
                      {pathname === item.href && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                      )}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/seguimiento"
                className={cn(
                  'group flex items-center gap-1.5 px-5 py-2.5 rounded-full font-semibold text-[15px] transition-all duration-300 border-2',
                  pathname === '/seguimiento' || pathname.startsWith('/seguimiento/')
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-dark/15 text-dark hover:border-primary hover:text-primary'
                )}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Mi Pedido
              </Link>
              <Link
                href="/agendar"
                className="group relative px-7 py-2.5 bg-primary text-white rounded-full font-semibold text-[15px] overflow-hidden transition-all duration-300 hover:shadow-[0_4px_20px_rgba(212,132,124,0.4)] active:scale-[0.97]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Haz tu Pedido
                  <svg
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-primary-hover opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2.5 -mr-2 text-dark hover:text-primary transition-colors rounded-xl hover:bg-secondary/60"
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navigation={navigation}
      />
    </>
  )
}
