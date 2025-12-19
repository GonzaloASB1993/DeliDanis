'use client'

import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

export interface EventType {
  id: string
  name: string
  slug: string
  icon: string
  count?: number
}

interface EventTypeFilterProps {
  eventTypes: EventType[]
  selectedEventType: string | null
  onSelectEventType: (eventTypeSlug: string | null) => void
}

export function EventTypeFilter({
  eventTypes,
  selectedEventType,
  onSelectEventType,
}: EventTypeFilterProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-dark mb-4">Tipo de Evento</h3>
      <div className="space-y-2">
        <button
          onClick={() => onSelectEventType(null)}
          className={cn(
            'w-full text-left px-4 py-3 rounded-lg transition-all duration-200',
            selectedEventType === null
              ? 'bg-primary text-white shadow-md'
              : 'hover:bg-secondary text-dark'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎂</span>
              <span className="font-medium">Todos los Eventos</span>
            </div>
          </div>
        </button>

        {eventTypes.map((eventType) => (
          <button
            key={eventType.id}
            onClick={() => onSelectEventType(eventType.slug)}
            className={cn(
              'w-full text-left px-4 py-3 rounded-lg transition-all duration-200',
              selectedEventType === eventType.slug
                ? 'bg-primary text-white shadow-md'
                : 'hover:bg-secondary text-dark'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{eventType.icon}</span>
                <span className="font-medium">{eventType.name}</span>
              </div>
              {eventType.count !== undefined && (
                <Badge
                  variant={selectedEventType === eventType.slug ? 'success' : 'default'}
                  className={
                    selectedEventType === eventType.slug
                      ? 'bg-white/20 text-white'
                      : 'bg-primary/10 text-primary'
                  }
                >
                  {eventType.count}
                </Badge>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-secondary/50 rounded-lg border border-primary/10">
        <p className="text-sm text-dark-light">
          💡 <span className="font-semibold text-dark">Tip:</span> Cada sabor puede personalizarse según tu evento
        </p>
      </div>
    </div>
  )
}
