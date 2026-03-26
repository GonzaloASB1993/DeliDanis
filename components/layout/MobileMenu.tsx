'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils/cn'

interface NavigationItem {
  name: string
  href: string
  submenu?: { name: string; href: string; description?: string }[]
}

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  navigation: NavigationItem[]
}

export function MobileMenu({ isOpen, onClose, navigation }: MobileMenuProps) {
  const pathname = usePathname()
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)

  // Close on route change
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    onCloseRef.current()
  }, [pathname])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // GSAP animation for menu items
  useEffect(() => {
    if (!isOpen || !navRef.current) return

    const items = navRef.current.querySelectorAll('[data-menu-item]')
    const cta = navRef.current.querySelector('[data-menu-cta]')

    gsap.fromTo(
      items,
      { opacity: 0, x: 20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out',
        delay: 0.15,
      }
    )

    if (cta) {
      gsap.fromTo(
        cta,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
          delay: 0.35,
        }
      )
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-dark/40 backdrop-blur-sm z-50 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        ref={menuRef}
        className={cn(
          'fixed top-0 right-0 bottom-0 w-[300px] max-w-[85vw] bg-white z-50 shadow-2xl transition-transform duration-400 ease-out lg:hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <Link href="/" className="relative h-12 w-auto" onClick={onClose}>
            <Image
              src="/logo.png"
              alt="DeliDanis"
              width={160}
              height={48}
              className="h-full w-auto object-contain"
            />
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-dark-light hover:text-dark transition-colors rounded-lg hover:bg-secondary/60"
            aria-label="Cerrar menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav ref={navRef} className="px-5 py-6 overflow-y-auto max-h-[calc(100vh-100px)]">
          <div className="space-y-1">
            {navigation.map((item) => (
              <div key={item.href} data-menu-item>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() =>
                        setExpandedItem(expandedItem === item.name ? null : item.name)
                      }
                      className={cn(
                        'w-full flex items-center justify-between py-3 px-4 rounded-xl font-medium text-[15px] transition-all duration-200',
                        pathname.startsWith(item.href)
                          ? 'bg-primary/8 text-primary'
                          : 'text-dark hover:bg-secondary/70'
                      )}
                    >
                      {item.name}
                      <svg
                        className={cn(
                          'w-4 h-4 transition-transform duration-300',
                          expandedItem === item.name ? 'rotate-180' : ''
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Submenu */}
                    <div
                      className={cn(
                        'overflow-hidden transition-all duration-300',
                        expandedItem === item.name
                          ? 'max-h-96 opacity-100 mt-1'
                          : 'max-h-0 opacity-0'
                      )}
                    >
                      <div className="ml-3 space-y-1 pb-2">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              'block py-2.5 px-4 rounded-lg text-sm transition-all duration-200',
                              pathname === subItem.href
                                ? 'bg-primary/8 text-primary font-medium'
                                : 'text-dark-light hover:bg-secondary/70 hover:text-dark'
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
                      'block py-3 px-4 rounded-xl font-medium text-[15px] transition-all duration-200',
                      pathname === item.href
                        ? 'bg-primary/8 text-primary'
                        : 'text-dark hover:bg-secondary/70'
                    )}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div data-menu-cta className="mt-8 pt-6 border-t border-border/40 space-y-3">
            <Link
              href="/seguimiento"
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 border-2 border-dark/15 text-dark rounded-full font-semibold text-[15px] hover:border-primary hover:text-primary transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Mi Pedido</span>
            </Link>
            <Link
              href="/agendar"
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-primary text-white rounded-full font-semibold text-[15px] hover:bg-primary-hover transition-colors duration-200 shadow-sm"
            >
              <span>Haz tu Pedido</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            {/* Quick contact */}
            <a
              href="https://wa.me/56939282764"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 mt-3 text-sm text-dark-light hover:text-dark transition-colors"
            >
              <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span>Escríbenos por WhatsApp</span>
            </a>
          </div>
        </nav>
      </div>
    </>
  )
}
