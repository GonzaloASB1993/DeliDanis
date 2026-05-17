import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { B2BCartItem } from '@/types/b2b'

interface B2BCartStore {
  items: B2BCartItem[]
  addItem: (item: B2BCartItem) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useB2BCartStore = create<B2BCartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(i => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map(i =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        })
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map(i =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }))
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(i => i.productId !== productId),
        }))
      },

      clear: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
      },

      getItemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },
    }),
    {
      name: 'b2b-cart',
    }
  )
)
