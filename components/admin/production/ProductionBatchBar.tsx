'use client'

interface ProductionBatchBarProps {
  selectedCount: number
  allPending: boolean
  onStartAll: () => void
  onCancelAll: () => void
  onDeselectAll: () => void
}

export function ProductionBatchBar({
  selectedCount,
  allPending,
  onStartAll,
  onCancelAll,
  onDeselectAll,
}: ProductionBatchBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
      <div className="bg-dark text-white rounded-2xl shadow-lg px-6 py-3 flex items-center gap-4">
        <span className="text-sm font-medium">
          {selectedCount} seleccionado{selectedCount > 1 ? 's' : ''}
        </span>

        <div className="w-px h-6 bg-white/20" />

        {allPending && (
          <button
            onClick={onStartAll}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Iniciar Todos
          </button>
        )}

        <button
          onClick={onCancelAll}
          className="px-4 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Cancelar
        </button>

        <button
          onClick={onDeselectAll}
          className="px-3 py-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors"
        >
          Deseleccionar
        </button>
      </div>
    </div>
  )
}
