'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { MobileMenu } from './MobileMenu'

interface NavigationItem {
  name: string
  href: string
  submenu?: { name: string; href: string }[]
}

const navigation: NavigationItem[] = [
  { name: 'Inicio', href: '/' },
  {
    name: 'Catálogo',
    href: '/catalogo',
    submenu: [
      { name: 'Catálogo de Tortas', href: '/catalogo' },
      { name: 'Catálogo de Coctelería', href: '/catalogo/cocteleria' },
      { name: 'Catálogo de Pastelería', href: '/catalogo/pasteleria' },
    ],
  },
  { name: 'Nosotros', href: '/nosotros' },
  { name: 'Galería', href: '/galeria' },
  { name: 'Contacto', href: '/contacto' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-white/95 backdrop-blur-sm shadow-md py-4'
            : 'bg-transparent py-6'
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="font-display text-2xl md:text-3xl font-bold text-primary hover:text-primary-hover transition-colors"
            >
              DeliDanis
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
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
                          'font-medium transition-all duration-200 relative group flex items-center gap-1',
                          pathname.startsWith('/catalogo')
                            ? 'text-primary'
                            : 'text-dark hover:text-primary'
                        )}
                      >
                        {item.name}
                        <svg
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            activeDropdown === item.name ? 'rotate-180' : ''
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                        <span
                          className={cn(
                            'absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-200',
                            pathname.startsWith('/catalogo')
                              ? 'w-full'
                              : 'w-0 group-hover:w-full'
                          )}
                        />
                      </button>

                      {/* Dropdown Menu - con padding top para área continua */}
                      <div
                        className={cn(
                          'absolute top-full left-0 pt-2 transition-all duration-200',
                          activeDropdown === item.name
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 -translate-y-2 pointer-events-none'
                        )}
                      >
                        <div className="w-56 bg-white rounded-xl shadow-xl border border-border overflow-hidden">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={cn(
                                'block px-4 py-3 text-sm font-medium transition-colors duration-200',
                                pathname === subItem.href
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-dark hover:bg-secondary hover:text-primary'
                              )}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'font-medium transition-all duration-200 relative group',
                        pathname === item.href
                          ? 'text-primary'
                          : 'text-dark hover:text-primary'
                      )}
                    >
                      {item.name}
                      <span
                        className={cn(
                          'absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-200',
                          pathname === item.href ? 'w-full' : 'w-0 group-hover:w-full'
                        )}
                      />
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/agendar"
                className="px-6 py-2.5 bg-primary text-white rounded-full font-semibold hover:bg-primary-hover hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center gap-2 animate-bounce-gentle hover:animate-none"
              >
                <span>Haz tu Pedido</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-dark hover:text-primary transition-colors"
              aria-label="Abrir menú"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
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
