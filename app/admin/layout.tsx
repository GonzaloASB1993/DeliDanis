'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/admin/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils/cn'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isLoading, isAuthenticated } = useAuth()

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // No mostrar sidebar en la página de login
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-dark-light">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, mostrar solo el children (el middleware redirigirá)
  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Sidebar */}
      <Sidebar
        collapsed={isMobile ? !mobileMenuOpen : sidebarCollapsed}
        onToggle={() => {
          if (isMobile) {
            setMobileMenuOpen(!mobileMenuOpen)
          } else {
            setSidebarCollapsed(!sidebarCollapsed)
          }
        }}
      />

      {/* Overlay para móvil */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Botón hamburguesa móvil */}
      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="fixed top-4 left-4 z-20 p-2 bg-white rounded-lg shadow-md lg:hidden"
        >
          <svg className="w-6 h-6 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Main content */}
      <main
        className={cn(
          'transition-all duration-300',
          isMobile ? 'ml-0' : (sidebarCollapsed ? 'ml-[70px]' : 'ml-[260px]')
        )}
      >
        {children}
      </main>
    </div>
  )
}
