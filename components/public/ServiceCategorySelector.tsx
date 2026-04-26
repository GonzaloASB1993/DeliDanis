'use client'

import { cn } from '@/lib/utils/cn'
import type { ServiceType } from '@/stores/bookingStoreMulti'

interface ServiceCategory {
  type: ServiceType
  name: string
  iconPath: string
  description: string
  features: string[]
}

const serviceCategories: ServiceCategory[] = [
  {
    type: 'torta',
    name: 'Tortas Personalizadas',
    iconPath: 'M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.701 2.701 0 001 15.546M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z',
    description: 'Diseños únicos para tu celebración',
    features: ['Sabores premium', 'Diseño personalizado', 'Rellenos generosos'],
  },
  {
    type: 'cocteleria',
    name: 'Coctelería para Eventos',
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    description: 'Pasabocas dulces y salados',
    features: ['Mini hamburguesas', 'Selladitos', 'Empanadas', 'Mini postres'],
  },
  {
    type: 'pasteleria',
    name: 'Pastelería Artesanal',
    iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    description: 'Delicias frescas para tu evento',
    features: ['Pie de limón', 'Tartas', 'Galletas y rollitos'],
  },
]

interface ServiceCategorySelectorProps {
  selectedCategory: ServiceType | null
  onSelectCategory: (type: ServiceType) => void
}

export function ServiceCategorySelector({
  selectedCategory,
  onSelectCategory,
}: ServiceCategorySelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {serviceCategories.map((category) => (
          <button
            key={category.type}
            onClick={() => onSelectCategory(category.type)}
            className={cn(
              'relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group hover:scale-105',
              selectedCategory === category.type
                ? 'border-primary bg-primary/10 shadow-xl ring-4 ring-primary/20'
                : 'border-border hover:border-primary/50 bg-white hover:shadow-lg'
            )}
          >
            {/* Icono grande */}
            <div className="w-12 h-12 mb-4 transition-transform duration-300 group-hover:scale-110 text-dark-light">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={category.iconPath} />
              </svg>
            </div>

            {/* Título */}
            <h3 className="font-display text-2xl font-bold text-dark mb-2">
              {category.name}
            </h3>

            {/* Descripción */}
            <p className="text-dark-light mb-4">{category.description}</p>

            {/* Features */}
            <ul className="space-y-2">
              {category.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-dark">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Checkmark cuando está seleccionado */}
            {selectedCategory === category.type && (
              <div className="absolute top-4 right-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Mensaje de ayuda */}
      <p className="text-center text-sm text-dark-light mt-4">
        Selecciona un servicio para continuar. Podrás agregar más servicios después.
      </p>
    </div>
  )
}
