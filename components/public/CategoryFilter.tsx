'use client'

import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

interface Category {
  id: string
  name: string
  slug: string
  count?: number
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (categorySlug: string | null) => void
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-dark mb-4">Categorías</h3>
      <div className="space-y-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            'w-full text-left px-4 py-2 rounded-lg transition-colors duration-200',
            selectedCategory === null
              ? 'bg-primary text-white'
              : 'hover:bg-secondary text-dark'
          )}
        >
          <div className="flex items-center justify-between">
            <span>Todas las Categorías</span>
            {!selectedCategory && (
              <Badge variant="success" className="bg-white/20 text-white">
                Activo
              </Badge>
            )}
          </div>
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.slug)}
            className={cn(
              'w-full text-left px-4 py-2 rounded-lg transition-colors duration-200',
              selectedCategory === category.slug
                ? 'bg-primary text-white'
                : 'hover:bg-secondary text-dark'
            )}
          >
            <div className="flex items-center justify-between">
              <span>{category.name}</span>
              {category.count !== undefined && (
                <Badge
                  variant={selectedCategory === category.slug ? 'success' : 'default'}
                  className={
                    selectedCategory === category.slug
                      ? 'bg-white/20 text-white'
                      : ''
                  }
                >
                  {category.count}
                </Badge>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
