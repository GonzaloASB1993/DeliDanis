import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: Math.random().toString(36).slice(2) },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

// Callable outside React components
export const toast = {
  success: (message: string, duration = 4000) =>
    useToastStore.getState().addToast({ message, variant: 'success', duration }),
  error: (message: string, duration = 4000) =>
    useToastStore.getState().addToast({ message, variant: 'error', duration }),
  warning: (message: string, duration = 4000) =>
    useToastStore.getState().addToast({ message, variant: 'warning', duration }),
  info: (message: string, duration = 4000) =>
    useToastStore.getState().addToast({ message, variant: 'info', duration }),
}
