'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, CalendarDays } from 'lucide-react'
import { useB2BCartStore } from '@/stores/b2bCartStore'
import { B2BCartTable } from '@/components/b2b/B2BCartTable'
import { createB2BOrder, getB2BCustomer } from '@/lib/supabase/b2b-queries'
import { toast } from '@/stores/toastStore'

function getDefaultDate() {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  return d.toISOString().split('T')[0]
}

function getMinDate() {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  return d.toISOString().split('T')[0]
}

function formatDateDisplay(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export default function B2BCarritoPage() {
  const router = useRouter()
  const { items, getTotal, clear } = useB2BCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deliveryDate, setDeliveryDate] = useState(getDefaultDate)

  const total = getTotal()

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      const customer = await getB2BCustomer()
      if (!customer) {
        toast.error('No se pudo obtener los datos del cliente. Por favor inicia sesión nuevamente.')
        setIsSubmitting(false)
        return
      }

      const result = await createB2BOrder(customer.id, items, deliveryDate)

      if (result.success && result.data) {
        clear()
        toast.success('Pedido confirmado exitosamente.')

        fetch('/api/email/b2b-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: result.data.id }),
        }).catch(console.error)

        router.push(`/b2b/pedidos/${result.data.id}`)
      } else {
        toast.error(result.error ?? 'Ocurrió un error al confirmar el pedido. Intenta nuevamente.')
      }
    } catch {
      toast.error('Ocurrió un error inesperado. Intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
          Agrega productos desde el catálogo.
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="font-display text-3xl font-bold text-dark">
        Resumen del Pedido
      </h1>

      <B2BCartTable />

      {/* Delivery date */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
        <div className="flex items-center gap-3 mb-3">
          <CalendarDays size={18} className="text-primary" />
          <span className="font-body text-sm font-semibold text-dark">Fecha de entrega</span>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={deliveryDate}
            min={getMinDate()}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="border border-border rounded-lg px-4 py-2.5 font-body text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          <span className="text-sm text-dark-light">
            Mínimo 3 días desde hoy. Fecha seleccionada: <strong>{formatDateDisplay(deliveryDate)}</strong>
          </span>
        </div>
      </div>

      {/* Footer card */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-dark-light text-sm font-medium">Total</span>
          <span className="font-display text-2xl font-bold text-dark">
            ${total.toLocaleString('es-CL')}
          </span>
        </div>

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
