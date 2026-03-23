'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { useToastStore, type Toast } from '@/stores/toastStore'

const variantStyles = {
  success: {
    container: 'bg-white border-l-4 border-success',
    icon: 'text-success',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  error: {
    container: 'bg-white border-l-4 border-primary',
    icon: 'text-primary',
    iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    container: 'bg-white border-l-4 border-warning',
    icon: 'text-warning',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  info: {
    container: 'bg-white border-l-4 border-info',
    icon: 'text-info',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
}

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const styles = variantStyles[toast.variant]

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, removeToast])

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl shadow-lg min-w-[280px] max-w-sm',
        'animate-slide-up',
        styles.container
      )}
      role="alert"
    >
      <svg
        className={cn('w-5 h-5 flex-shrink-0 mt-0.5', styles.icon)}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={styles.iconPath}
        />
      </svg>
      <p className="text-sm text-dark flex-1">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-dark-light hover:text-dark transition-colors flex-shrink-0"
        aria-label="Cerrar"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

export { type Toast }
