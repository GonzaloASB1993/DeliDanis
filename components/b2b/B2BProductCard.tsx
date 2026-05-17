'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { useB2BCartStore } from '@/stores/b2bCartStore'
import { toast } from '@/stores/toastStore'
import type { B2BProduct } from '@/types/b2b'

interface B2BProductCardProps {
  product: B2BProduct
}

const TYPE_LABELS: Record<B2BProduct['product_type'], string> = {
  cake: 'Tortas',
  pastry: 'Pastelería',
  cocktail: 'Coctelería',
}

export function B2BProductCard({ product }: B2BProductCardProps) {
  const [quantity, setQuantity] = useState(product.min_quantity)
  const addItem = useB2BCartStore((s) => s.addItem)

  const decrement = () => {
    setQuantity((q) => Math.max(product.min_quantity, q - 1))
  }

  const increment = () => {
    setQuantity((q) => q + 1)
  }

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val >= product.min_quantity) {
      setQuantity(val)
    }
  }

  const handleAdd = () => {
    addItem({
      productId: product.id,
      productType: product.product_type,
      productName: product.name,
      imageUrl: product.image_url,
      quantity,
      unitPrice: product.b2b_price,
      minQuantity: product.min_quantity,
    })
    toast.success(`"${product.name}" agregado al pedido`)
    setQuantity(product.min_quantity)
  }

  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(product.b2b_price)

  return (
    <article className="group bg-white rounded-2xl overflow-hidden border border-border flex flex-col hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="relative aspect-square bg-secondary overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-border"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Category */}
        <span className="text-[11px] font-medium uppercase tracking-wider text-dark-light">
          {product.category_name ?? TYPE_LABELS[product.product_type]}
        </span>

        {/* Name */}
        <h3 className="text-sm font-semibold text-dark leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-base font-bold text-accent">{formattedPrice}</span>
          <span className="text-xs text-dark-light">c/u</span>
        </div>

        {/* Min quantity note */}
        {product.min_quantity > 1 && (
          <p className="text-[11px] text-dark-light">
            Mín. {product.min_quantity} unidades
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Quantity selector + Add button */}
        <div className="flex items-center gap-2 mt-1">
          {/* Quantity row */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={decrement}
              disabled={quantity <= product.min_quantity}
              className="px-2 py-1.5 text-dark-light hover:text-dark hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Reducir cantidad"
            >
              <Minus size={13} />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityInput}
              min={product.min_quantity}
              className="w-10 text-center text-sm font-medium text-dark bg-transparent focus:outline-none"
              aria-label="Cantidad"
            />
            <button
              type="button"
              onClick={increment}
              className="px-2 py-1.5 text-dark-light hover:text-dark hover:bg-secondary transition-colors"
              aria-label="Aumentar cantidad"
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Add button */}
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors"
          >
            <ShoppingCart size={14} />
            Agregar
          </button>
        </div>
      </div>
    </article>
  )
}
