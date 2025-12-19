import { create } from 'zustand'
import type { ProductWithImages } from '@/types'

export interface BookingData {
  // Tipo de evento
  eventType: string | null

  // Selección de producto y fecha
  product: ProductWithImages | null
  eventDate: Date | null
  eventTime: string | null
  deliveryDate: Date | null
  deliveryTime: string | null
  deliveryType: 'pickup' | 'delivery' | null

  // Personalización
  portions: number
  customizations: {
    flavor?: string
    filling?: string
    frosting?: string
    message?: string
    specialRequests?: string
  }

  // Información del cliente
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address?: string
    city?: string
  }

  // Cálculos
  subtotal: number
  deliveryFee: number
  total: number
}

interface BookingStore {
  bookingData: BookingData
  currentStep: number

  // Actions
  setEventType: (eventType: string) => void
  setProduct: (product: ProductWithImages) => void
  setEventDate: (date: Date) => void
  setEventTime: (time: string) => void
  setDeliveryDate: (date: Date) => void
  setDeliveryTime: (time: string) => void
  setDeliveryType: (type: 'pickup' | 'delivery') => void
  setPortions: (portions: number) => void
  setCustomizations: (customizations: Partial<BookingData['customizations']>) => void
  setCustomer: (customer: Partial<BookingData['customer']>) => void
  calculateTotal: () => void
  nextStep: () => void
  prevStep: () => void
  resetBooking: () => void
}

const initialBookingData: BookingData = {
  eventType: null,
  product: null,
  eventDate: null,
  eventTime: null,
  deliveryDate: null,
  deliveryTime: null,
  deliveryType: null as any, // null inicialmente, se selecciona después
  portions: 15,
  customizations: {},
  customer: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  },
  subtotal: 0,
  deliveryFee: 0,
  total: 0,
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookingData: initialBookingData,
  currentStep: 1,

  setEventType: (eventType) =>
    set((state) => ({
      bookingData: { ...state.bookingData, eventType },
    })),

  setProduct: (product) => {
    set((state) => ({
      bookingData: {
        ...state.bookingData,
        product,
        portions: product.min_portions,
      },
    }))
    get().calculateTotal()
  },

  setEventDate: (date) =>
    set((state) => ({
      bookingData: { ...state.bookingData, eventDate: date },
    })),

  setEventTime: (time) =>
    set((state) => ({
      bookingData: { ...state.bookingData, eventTime: time },
    })),

  setDeliveryDate: (date) =>
    set((state) => ({
      bookingData: { ...state.bookingData, deliveryDate: date },
    })),

  setDeliveryTime: (time) =>
    set((state) => ({
      bookingData: { ...state.bookingData, deliveryTime: time },
    })),

  setDeliveryType: (type) => {
    set((state) => ({
      bookingData: { ...state.bookingData, deliveryType: type },
    }))
    get().calculateTotal()
  },

  setPortions: (portions) => {
    set((state) => ({
      bookingData: { ...state.bookingData, portions },
    }))
    get().calculateTotal()
  },

  setCustomizations: (customizations) =>
    set((state) => ({
      bookingData: {
        ...state.bookingData,
        customizations: { ...state.bookingData.customizations, ...customizations },
      },
    })),

  setCustomer: (customer) =>
    set((state) => ({
      bookingData: {
        ...state.bookingData,
        customer: { ...state.bookingData.customer, ...customer },
      },
    })),

  calculateTotal: () => {
    const { product, portions, deliveryType } = get().bookingData

    if (!product) return

    let subtotal = product.base_price

    // Calcular precio según porciones
    if (portions > product.min_portions && product.price_per_portion) {
      const additionalPortions = portions - product.min_portions
      subtotal = product.base_price + (additionalPortions * product.price_per_portion)
    }

    // Calcular tarifa de entrega
    const deliveryFee = deliveryType === 'delivery' ? 15000 : 0

    const total = subtotal + deliveryFee

    set((state) => ({
      bookingData: {
        ...state.bookingData,
        subtotal,
        deliveryFee,
        total,
      },
    }))
  },

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 4),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),

  resetBooking: () =>
    set({
      bookingData: initialBookingData,
      currentStep: 1,
    }),
}))
