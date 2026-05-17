'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useB2BCartStore } from '@/stores/b2bCartStore'

export function B2BNavbar() {
  const router = useRouter()
  const itemCount = useB2BCartStore((s) => s.getItemCount())
  const [customerName, setCustomerName] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    async function loadCustomer() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('customers')
        .select('first_name, last_name, business_name')
        .eq('user_id', user.id)
        .single()

      if (data) {
        const name =
          data.business_name ||
          [data.first_name, data.last_name].filter(Boolean).join(' ') ||
          null
        setCustomerName(name)
      }
    }

    loadCustomer()
  }, [])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await supabase.auth.signOut()
    router.push('/b2b/login')
  }

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/b2b" className="flex items-center gap-2 shrink-0">
            <span className="font-display font-bold text-xl text-dark">
              DeliDanis
            </span>
            <span className="text-xs font-body font-600 bg-primary text-white px-2 py-0.5 rounded-full leading-tight">
              B2B
            </span>
          </Link>

          {/* Center nav */}
          <div className="hidden sm:flex items-center gap-6">
            <Link
              href="/b2b"
              className="font-body text-sm font-medium text-dark-light hover:text-primary transition-colors"
            >
              Catálogo
            </Link>
            <Link
              href="/b2b/pedidos"
              className="font-body text-sm font-medium text-dark-light hover:text-primary transition-colors"
            >
              Mis Pedidos
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link
              href="/b2b/carrito"
              className="relative p-2 text-dark-light hover:text-primary transition-colors"
              aria-label="Ver carrito"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-white text-[10px] font-body font-semibold rounded-full px-1 leading-none">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Customer name */}
            {customerName && (
              <span className="hidden sm:block font-body text-sm text-dark-light truncate max-w-[140px]">
                {customerName}
              </span>
            )}

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="font-body text-sm font-medium text-dark-light hover:text-primary transition-colors disabled:opacity-50"
            >
              {isSigningOut ? 'Saliendo…' : 'Salir'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
