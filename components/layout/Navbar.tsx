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
  {
    name: 'Catálogo',
    href: '/catalogo',
    submenu: [
      { name: 'Tortas', href: '/catalogo', description: 'Tortas personalizadas para tu evento' },
      { name: 'Coctelería', href: '/catalogo/cocteleria', description: 'Delicias para cocktails y recepciones' },
      { name: 'Pastelería', href: '/catalogo/pasteleria', description: 'Postres y dulces artesanales' },
    ],
  },
  { name: 'Servicios', href: '/#servicios' },
  { name: 'Galería', href: '/galeria' },
  { name: 'Nosotros', href: '/nosotros' },
  { name: 'Contacto', href: '/contacto' },
]

/**
 * Check if a nav item is currently active based on the pathname.
 * Handles hash links (/#servicios) and path-based routes.
 */
function isNavItemActive(item: NavigationItem, pathname: string): boolean {
  if (item.submenu) {
    return pathname.startsWith('/catalogo')
  }
  if (item.href.startsWith('/#')) {
    return pathname === '/'
      ? false // Hash links don't highlight on homepage — avoids false positives
      : false
  }
  return pathname === item.href
}

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
      {/* Navbar blanco sólido siempre — legible sobre cualquier foto de hero, sin depender de scrims */}
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out',
          'bg-white/95 backdrop-blur-md shadow-[0_1px_20px_rgba(61,61,61,0.08)]',
          isScrolled ? 'py-2' : 'py-3'
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
            <nav className="hidden lg:flex items-center gap-1" aria-label="Navegación principal">
              {navigation.map((item) => {
                const active = isNavItemActive(item, pathname)

                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => item.submenu && setActiveDropdown(item.name)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    {item.submenu ? (
                      <>
                        <button
                          aria-expanded={activeDropdown === item.name}
                          aria-haspopup="true"
                          className={cn(
                            'px-4 py-2.5 rounded-full text-[15px] font-medium transition-all duration-300 relative flex items-center gap-1.5',
                            active
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
                          {active && (
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
                          'px-4 py-2.5 rounded-full text-[15px] font-medium transition-all duration-300 relative inline-block',
                          active
                            ? 'text-primary'
                            : 'text-dark/80 hover:text-dark hover:bg-secondary/60'
                        )}
                      >
                        {item.name}
                        {active && (
                          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                        )}
                      </Link>
                    )}
                  </div>
                )
              })}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/agendar"
                className="bg-primary text-white hover:bg-primary-hover rounded-full px-6 py-2 text-sm font-semibold transition-all duration-300 hover:shadow-[0_4px_20px_rgba(212,132,124,0.4)] active:scale-[0.97]"
              >
                Agenda ahora
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2.5 -mr-2 transition-colors rounded-xl text-dark hover:text-primary hover:bg-secondary/60"
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
