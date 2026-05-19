'use client'

import Image from 'next/image'
import { Trash2, Minus, Plus } from 'lucide-react'
import { useB2BCartStore } from '@/stores/b2bCartStore'
import type { B2BCartItem } from '@/types/b2b'

export function B2BCartTable() {
  const { items, updateQuantity, removeItem } = useB2BCartStore()

  if (items.length === 0) return null

  const handleDecrement = (item: B2BCartItem) => {
    const next = item.quantity - 1
    if (next < item.minQuantity) return
    updateQuantity(item.productId, next)
  }

  const handleIncrement = (item: B2BCartItem) => {
    updateQuantity(item.productId, item.quantity + 1)
  }

  const handleInputChange = (item: B2BCartItem, value: string) => {
    const parsed = parseInt(value, 10)
    if (isNaN(parsed)) return
    const clamped = Math.max(item.minQuantity, parsed)
    updateQuantity(item.productId, clamped)
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary">
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-dark-light px-6 py-4">
                Producto
              </th>
              <th className="text-right text-xs font-semibold uppercase tracking-wide text-dark-light px-4 py-4">
                Precio
              </th>
              <th className="text-center text-xs font-semibold uppercase tracking-wide text-dark-light px-4 py-4">
                Cantidad
              </th>
              <th className="text-right text-xs font-semibold uppercase tracking-wide text-dark-light px-4 py-4">
                Subtotal
              </th>
              <th className="px-4 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item.productId} className="hover:bg-secondary/40 transition-colors">
                {/* Product */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-dark-light text-xs">
                          Sin img
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-dark text-sm leading-tight">
                        {item.productName}
                      </span>
                      {item.portions && (
                        <span className="text-[11px] text-dark-light mt-0.5">
                          {item.portions} porciones
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Unit price */}
                <td className="px-4 py-4 text-right text-sm text-dark-light whitespace-nowrap">
                  ${item.unitPrice.toLocaleString('es-CL')}
                </td>

                {/* Quantity selector */}
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleDecrement(item)}
                      disabled={item.quantity <= item.minQuantity}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-dark-light hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Reducir cantidad"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      min={item.minQuantity}
                      onChange={(e) => handleInputChange(item, e.target.value)}
                      className="w-14 text-center text-sm font-medium border border-border rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      onClick={() => handleIncrement(item)}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-dark-light hover:bg-secondary transition-colors"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </td>

                {/* Subtotal */}
                <td className="px-4 py-4 text-right text-sm font-semibold text-dark whitespace-nowrap">
                  ${(item.quantity * item.unitPrice).toLocaleString('es-CL')}
                </td>

                {/* Remove */}
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-1.5 rounded-lg text-dark-light hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
