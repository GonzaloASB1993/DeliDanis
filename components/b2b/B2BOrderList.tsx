'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, RotateCcw } from 'lucide-react'
import { useB2BCartStore } from '@/stores/b2bCartStore'
import { toast } from '@/stores/toastStore'
import { getOrderItemsForRepeat } from '@/lib/supabase/b2b-queries'
import type { B2BOrderSummary } from '@/types/b2b'

interface B2BOrderListProps {
  orders: B2BOrderSummary[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  in_production: { label: 'En producción', color: 'bg-purple-100 text-purple-800' },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-800' },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
  completed: { label: 'Completado', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount)
}

function OrderCard({ order }: { order: B2BOrderSummary }) {
  const router = useRouter()
  const { clear, addItem } = useB2BCartStore()
  const status = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-800' }

  const handleRepeat = async () => {
    const items = await getOrderItemsForRepeat(order.id)

    if (!items || items.length === 0) {
      toast.error('No se pudieron obtener los productos del pedido.')
      return
    }

    clear()

    for (const item of items) {
      addItem({
        productId: item.product_id ?? item.id,
        productType: (item.product_type as 'cake' | 'pastry' | 'cocktail') ?? 'cake',
        productName: item.product_name,
        imageUrl: item.image_url,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        minQuantity: 1,
        ...(item.portions ? { portions: item.portions } : {}),
      })
    }

    toast.success('Pedido agregado al carrito. Revísalo antes de confirmar.')
    router.push('/b2b/carrito')
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-sm transition-shadow duration-200">
      {/* Left section */}
      <div className="flex-1 min-w-0">
        {/* Top row: number + badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/b2b/pedidos/${order.id}`}
            className="font-semibold text-dark hover:text-primary transition-colors"
          >
            {order.order_number}
          </Link>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
          >
            {status.label}
          </span>
        </div>

        {/* Bottom row: meta info */}
        <div className="mt-1 flex items-center gap-2 text-sm text-dark-light flex-wrap">
          <span>{formatDate(order.created_at)}</span>
          <span className="text-border">·</span>
          <span>
            {order.item_count} {order.item_count === 1 ? 'producto' : 'productos'}
          </span>
          <span className="text-border">·</span>
          <span className="font-medium text-dark">{formatCurrency(order.total)}</span>
        </div>
      </div>

      {/* Right section: repeat button */}
      <div className="sm:flex-shrink-0">
        <button
          type="button"
          onClick={handleRepeat}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary text-sm font-semibold hover:bg-primary/5 active:bg-primary/10 transition-colors whitespace-nowrap"
        >
          <RotateCcw size={14} />
          Repetir pedido
        </button>
      </div>
    </div>
  )
}

export function B2BOrderList({ orders }: B2BOrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ShoppingBag className="text-dark-light" size={24} />
        </div>
        <p className="text-dark font-medium">Todavía no tienes pedidos</p>
        <p className="text-sm text-dark-light mt-1">
          Cuando realices tu primer pedido aparecerá acá.
        </p>
        <Link
          href="/b2b"
          className="mt-6 inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors"
        >
          Ver catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}
