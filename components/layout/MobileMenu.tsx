'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface NavigationItem {
  name: string
  href: string
  submenu?: { name: string; href: string }[]
}

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  navigation: NavigationItem[]
}

export function MobileMenu({ isOpen, onClose, navigation }: MobileMenuProps) {
  const pathname = usePathname()
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  // Close menu on route change
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Prevent body scroll when menu is open
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

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-dark/50 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 w-[280px] bg-white z-50 shadow-xl transition-transform duration-300 md:hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Close Button */}
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="p-2 text-dark hover:text-primary transition-colors"
            aria-label="Cerrar menú"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="px-6 py-4">
          <div className="space-y-2">
            {navigation.map((item) => (
              <div key={item.href}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() =>
                        setExpandedItem(expandedItem === item.name ? null : item.name)
                      }
                      className={cn(
                        'w-full flex items-center justify-between py-3 px-4 rounded-lg font-medium transition-all duration-200',
                        pathname.startsWith(item.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-dark hover:bg-secondary'
                      )}
                    >
                      {item.name}
                      <svg
                        className={cn(
                          'w-5 h-5 transition-transform duration-200',
                          expandedItem === item.name ? 'rotate-180' : ''
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
                    </button>

                    {/* Submenu */}
                    <div
                      className={cn(
                        'overflow-hidden transition-all duration-300',
                        expandedItem === item.name
                          ? 'max-h-96 opacity-100 mt-2'
                          : 'max-h-0 opacity-0'
                      )}
                    >
                      <div className="ml-4 space-y-2">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              'block py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200',
                              pathname === subItem.href
                                ? 'bg-primary/10 text-primary'
                                : 'text-dark-light hover:bg-secondary hover:text-primary'
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
                      'block py-3 px-4 rounded-lg font-medium transition-all duration-200',
                      pathname === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-dark hover:bg-secondary'
                    )}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="mt-8">
            <Link
              href="/agendar"
              className="block w-full py-3 px-6 bg-primary text-white text-center rounded-full font-semibold hover:bg-primary-hover transition-all duration-200 flex items-center justify-center gap-2 animate-bounce-gentle hover:animate-none"
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
        </nav>
      </div>
    </>
  )
}
