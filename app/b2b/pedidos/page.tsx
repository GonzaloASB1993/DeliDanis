'use client'

import { useEffect, useState } from 'react'
import { B2BOrderList } from '@/components/b2b/B2BOrderList'
import { getB2BOrders } from '@/lib/supabase/b2b-queries'
import type { B2BOrderSummary } from '@/types/b2b'

function SkeletonOrderCard() {
  return (
    <div className="bg-white rounded-xl border border-border p-4 animate-pulse flex flex-col sm:flex-row gap-4">
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-4 w-32 bg-secondary rounded" />
          <div className="h-5 w-20 bg-secondary rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-20 bg-secondary rounded" />
          <div className="h-3 w-16 bg-secondary rounded" />
          <div className="h-3 w-16 bg-secondary rounded" />
        </div>
      </div>
      <div className="sm:flex-shrink-0">
        <div className="h-9 w-36 bg-secondary rounded-lg" />
      </div>
    </div>
  )
}

export default function B2BPedidosPage() {
  const [orders, setOrders] = useState<B2BOrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await getB2BOrders()
        if (cancelled) return
        setOrders(result)
      } catch {
        if (cancelled) return
        setError('No se pudo cargar el historial de pedidos. Intenta nuevamente.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-dark">Mis pedidos</h1>
        <p className="text-sm text-dark-light mt-1">
          Historial de todos tus pedidos mayoristas.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonOrderCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-sm text-dark-light">{error}</p>
        </div>
      ) : (
        <B2BOrderList orders={orders} />
      )}
    </div>
  )
}
