'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { B2BOrderDetailView } from '@/components/b2b/B2BOrderDetail'
import { getB2BOrderDetail } from '@/lib/supabase/b2b-queries'
import type { B2BOrderDetail } from '@/types/b2b'

function SkeletonDetail() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
      {/* Back link placeholder */}
      <div className="h-4 w-28 bg-secondary rounded mb-6" />

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-5 w-40 bg-secondary rounded" />
            <div className="h-3 w-28 bg-secondary rounded" />
          </div>
          <div className="h-6 w-24 bg-secondary rounded-full" />
        </div>

        {/* Table rows */}
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="flex-1 h-4 bg-secondary rounded" />
              <div className="w-10 h-4 bg-secondary rounded" />
              <div className="w-20 h-4 bg-secondary rounded" />
              <div className="w-24 h-4 bg-secondary rounded" />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-6">
          <div className="h-4 w-12 bg-secondary rounded" />
          <div className="h-6 w-28 bg-secondary rounded" />
        </div>
      </div>
    </div>
  )
}

export default function B2BOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<B2BOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return

    let cancelled = false

    async function load() {
      const result = await getB2BOrderDetail(id)
      if (cancelled) return

      if (!result) {
        setNotFound(true)
      } else {
        setOrder(result)
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <SkeletonDetail />

  if (notFound || !order) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link
          href="/b2b/pedidos"
          className="inline-flex items-center gap-2 text-sm text-dark-light hover:text-dark transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Volver a pedidos
        </Link>
        <div className="text-center py-20">
          <p className="text-dark font-medium">Pedido no encontrado</p>
          <p className="text-sm text-dark-light mt-1">
            El pedido que buscás no existe o no tenés acceso.
          </p>
        </div>
      </div>
    )
  }

  return <B2BOrderDetailView order={order} />
}
