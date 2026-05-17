'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { useB2BCartStore } from '@/stores/b2bCartStore'
import { B2BCartTable } from '@/components/b2b/B2BCartTable'
import { createB2BOrder, getB2BCustomer } from '@/lib/supabase/b2b-queries'
import { toast } from '@/stores/toastStore'

export default function B2BCarritoPage() {
  const router = useRouter()
  const { items, getTotal, clear } = useB2BCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const total = getTotal()

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      const customer = await getB2BCustomer()
      if (!customer) {
        toast.error('No se pudo obtener los datos del cliente. Por favor iniciá sesión nuevamente.')
        setIsSubmitting(false)
        return
      }

      const result = await createB2BOrder(customer.id, items)

      if (result.success && result.orderId) {
        clear()
        toast.success('Pedido confirmado exitosamente.')
        router.push(`/b2b/pedidos/${result.orderId}`)
      } else {
        toast.error(result.error ?? 'Ocurrió un error al confirmar el pedido. Intentá nuevamente.')
      }
    } catch {
      toast.error('Ocurrió un error inesperado. Intentá nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
          <ShoppingCart className="w-10 h-10 text-dark-light" />
        </div>
        <h1 className="font-display text-2xl font-bold text-dark mb-2">
          Tu pedido está vacío
        </h1>
        <p className="text-dark-light mb-8">
          Agregá productos desde el catálogo.
        </p>
        <Link
          href="/b2b"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold text-sm px-8 py-3 rounded-full transition-colors"
        >
          Ver Catálogo
        </Link>
      </div>
    )
  }

  // Cart with items
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="font-display text-3xl font-bold text-dark">
        Resumen del Pedido
      </h1>

      <B2BCartTable />

      {/* Footer card */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Total */}
        <div className="flex items-baseline gap-3">
          <span className="text-dark-light text-sm font-medium">Total</span>
          <span className="font-display text-2xl font-bold text-dark">
            ${total.toLocaleString('es-AR')}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/b2b"
            className="flex-1 sm:flex-none text-center border-2 border-dark text-dark font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-dark/5 transition-colors"
          >
            Seguir comprando
          </Link>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm px-8 py-2.5 rounded-full transition-colors"
          >
            {isSubmitting ? 'Enviando...' : 'Confirmar Pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}
