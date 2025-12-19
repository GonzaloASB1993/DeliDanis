'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils/format'

interface PriceRange {
  min: number
  max: number
}

interface PriceFilterProps {
  priceRange: PriceRange
  onPriceChange: (range: PriceRange) => void
}

const priceRanges = [
  { label: 'Todos los precios', min: 0, max: Infinity },
  { label: 'Menos de $200,000', min: 0, max: 200000 },
  { label: '$200,000 - $400,000', min: 200000, max: 400000 },
  { label: '$400,000 - $600,000', min: 400000, max: 600000 },
  { label: 'Más de $600,000', min: 600000, max: Infinity },
]

export function PriceFilter({ priceRange, onPriceChange }: PriceFilterProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-dark mb-4">Rango de Precio</h3>
      <div className="space-y-2">
        {priceRanges.map((range, index) => (
          <button
            key={index}
            onClick={() => onPriceChange({ min: range.min, max: range.max })}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 ${
              priceRange.min === range.min && priceRange.max === range.max
                ? 'bg-primary text-white'
                : 'hover:bg-secondary text-dark'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  )
}
