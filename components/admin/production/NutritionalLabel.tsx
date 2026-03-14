'use client'

import type { NutritionalInfo } from '@/lib/supabase/production-queries'

interface NutritionalLabelProps {
  nutritionalInfo: NutritionalInfo
  servingSize?: number
  hasIncompleteData?: boolean
}

export function NutritionalLabel({
  nutritionalInfo,
  servingSize = 100,
  hasIncompleteData = false,
}: NutritionalLabelProps) {
  const rows = [
    { label: 'Energía', value: nutritionalInfo.calories, unit: 'kcal', indent: false },
    { label: 'Proteínas', value: nutritionalInfo.protein, unit: 'g', indent: false },
    { label: 'Grasas totales', value: nutritionalInfo.fat, unit: 'g', indent: false },
    { label: 'Grasas saturadas', value: nutritionalInfo.saturated_fat, unit: 'g', indent: true },
    { label: 'Hidratos de carbono', value: nutritionalInfo.carbohydrates, unit: 'g', indent: false },
    { label: 'Azúcares', value: nutritionalInfo.sugar, unit: 'g', indent: true },
    { label: 'Fibra', value: nutritionalInfo.fiber, unit: 'g', indent: false },
    { label: 'Sodio', value: nutritionalInfo.sodium, unit: 'mg', indent: false },
  ]

  return (
    <div className="border-2 border-dark rounded-lg overflow-hidden max-w-xs">
      <div className="bg-dark text-white px-4 py-2">
        <h4 className="font-bold text-sm uppercase tracking-wide">Información Nutricional</h4>
        <p className="text-xs text-white/70">Porción: {servingSize}g</p>
      </div>

      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between items-center px-4 py-1.5 text-sm"
          >
            <span className={row.indent ? 'pl-4 text-dark-light' : 'font-medium text-dark'}>
              {row.label}
            </span>
            <span className="font-mono text-dark tabular-nums">
              {row.value.toFixed(1)} {row.unit}
            </span>
          </div>
        ))}
      </div>

      {hasIncompleteData && (
        <div className="px-4 py-2 bg-warning/10 border-t border-warning/30">
          <p className="text-xs text-warning">
            * Algunos ingredientes no tienen información nutricional completa. Los valores mostrados son aproximados.
          </p>
        </div>
      )}
    </div>
  )
}
