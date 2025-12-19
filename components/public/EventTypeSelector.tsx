'use client'

import { cn } from '@/lib/utils/cn'

export const eventTypes = [
  { id: '1', name: 'Bodas', slug: 'bodas', icon: '💍', description: 'Elegantes y sofisticadas' },
  { id: '2', name: 'Quinceañeras', slug: 'quinceaneras', icon: '👑', description: 'Sueños hechos realidad' },
  { id: '3', name: 'Cumpleaños', slug: 'cumpleanos', icon: '🎈', description: 'Alegría y diversión' },
  { id: '4', name: 'Bautizos', slug: 'bautizos', icon: '🕊️', description: 'Dulces y delicados' },
  { id: '5', name: 'Primera Comunión', slug: 'primera-comunion', icon: '⛪', description: 'Momentos especiales' },
  { id: '6', name: 'Baby Shower', slug: 'baby-shower', icon: '👶', description: 'Tiernos y coloridos' },
  { id: '7', name: 'Corporativos', slug: 'corporativos', icon: '💼', description: 'Profesionales y elegantes' },
  { id: '8', name: 'Días Especiales', slug: 'dias-especiales', icon: '💝', description: 'Aniversarios, Día de la Madre, etc.' },
]

interface EventTypeSelectorProps {
  selectedEventType: string | null
  onSelectEventType: (slug: string) => void
}

export function EventTypeSelector({ selectedEventType, onSelectEventType }: EventTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {eventTypes.map((eventType) => (
          <button
            key={eventType.id}
            onClick={() => onSelectEventType(eventType.slug)}
            className={cn(
              'relative p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105',
              selectedEventType === eventType.slug
                ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50 bg-white'
            )}
          >
            <div className="text-3xl mb-2">{eventType.icon}</div>
            <p className="font-semibold text-dark text-sm mb-1">{eventType.name}</p>
            <p className="text-xs text-dark-light line-clamp-1">{eventType.description}</p>

            {selectedEventType === eventType.slug && (
              <div className="absolute top-2 right-2">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
