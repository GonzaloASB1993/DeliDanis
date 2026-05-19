'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import type { B2BOrderDetail } from '@/types/b2b'

interface B2BOrderDetailProps {
  order: B2BOrderDetail
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

export function B2BOrderDetailView({ order }: B2BOrderDetailProps) {
  const status = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-800' }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/b2b/pedidos"
        className="inline-flex items-center gap-2 text-sm text-dark-light hover:text-dark transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Volver a pedidos
      </Link>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-dark">
              {order.order_number}
            </h1>
            <p className="text-sm text-dark-light mt-0.5">
              Fecha: {formatDate(order.created_at)}
            </p>
          </div>
          <span
            className={`self-start sm:self-auto inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}
          >
            {status.label}
          </span>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3 font-medium text-dark-light">Producto</th>
                <th className="text-center px-4 py-3 font-medium text-dark-light">Cant.</th>
                <th className="text-right px-4 py-3 font-medium text-dark-light">Precio</th>
                <th className="text-right px-6 py-3 font-medium text-dark-light">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary overflow-hidden flex-shrink-0 relative">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-5 h-5 text-dark-light/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-dark">{item.product_name}</span>
                        {item.portions && (
                          <span className="text-[11px] text-dark-light">{item.portions} porciones</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-dark-light">{item.quantity}</td>
                  <td className="px-4 py-4 text-right text-dark-light">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-dark">
                    {formatCurrency(item.total_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer total */}
        <div className="px-6 py-4 border-t border-border flex justify-end">
          <div className="flex items-center gap-6">
            <span className="text-sm text-dark-light font-medium">Total</span>
            <span className="text-lg font-bold text-accent">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
