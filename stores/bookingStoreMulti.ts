import { create } from 'zustand'
import type { ProductWithImages } from '@/types'

// Tipos de servicios
export type ServiceType = 'torta' | 'cocteleria' | 'pasteleria'

// Servicio de Torta
export interface TortaService {
  type: 'torta'
  product: ProductWithImages
  portions: number
  customizations: {
    message?: string
    specialRequests?: string
  }
  price: number
}

// Servicio de Coctelería
export interface CocktailService {
  type: 'cocteleria'
  guests: number
  duration: 2 | 3 | 4 // horas
  includesBar: boolean
  specialRequests?: string
  price: number
}

// Servicio de Pastelería
export interface PastryService {
  type: 'pasteleria'
  items: {
    pieLimon: number
    tartas: number
    galletas: number // docenas
    rollitos: number // paquetes de 6
  }
  price: number
}

// Union type de todos los servicios
export type ServiceItem = (TortaService | CocktailService | PastryService) & {
  id: string
}

export interface BookingData {
  // Tipo de evento
  eventType: string | null

  // Servicios (array)
  services: ServiceItem[]

  // Fecha y entrega
  eventDate: Date | null
  eventTime: 'AM' | 'PM' | null
  deliveryType: 'pickup' | 'delivery' | null

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

  // Actions básicas
  setEventType: (eventType: string) => void
  setEventDate: (date: Date) => void
  setEventTime: (time: 'AM' | 'PM') => void
  setDeliveryType: (type: 'pickup' | 'delivery') => void
  setCustomer: (customer: Partial<BookingData['customer']>) => void

  // Actions para servicios
  addService: (service: Omit<ServiceItem, 'id'>) => void
  removeService: (serviceId: string) => void
  updateService: (serviceId: string, updates: Partial<ServiceItem>) => void
  clearServices: () => void

  // Cálculos
  calculateTotal: () => void

  // Navigation
  nextStep: () => void
  prevStep: () => void
  resetBooking: () => void
}

// Precios base
const PRICES = {
  // Coctelería: por invitado/hora
  cocktail: {
    perGuestPerHour: 9000,
    barSetup: 100000,
  },
  // Pastelería
  pastry: {
    pieLimon: 35000,
    tartas: 40000,
    galletas: 15000, // por docena
    rollitos: 25000, // por 6 unidades
  },
  // Entrega
  delivery: 15000,
}

const initialBookingData: BookingData = {
  eventType: null,
  services: [],
  eventDate: null,
  eventTime: null,
  deliveryType: null,
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

// Helper para generar ID único
const generateId = () => `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Helper para calcular precio de torta
const calculateTortaPrice = (service: Omit<TortaService, 'id' | 'price'>): number => {
  const { product, portions } = service
  let price = product.base_price

  if (portions > product.min_portions && product.price_per_portion) {
    const additionalPortions = portions - product.min_portions
    price = product.base_price + (additionalPortions * product.price_per_portion)
  }

  return price
}

// Helper para calcular precio de coctelería
const calculateCocktailPrice = (service: Omit<CocktailService, 'id' | 'price'>): number => {
  const { guests, duration, includesBar } = service
  let price = guests * duration * PRICES.cocktail.perGuestPerHour

  if (includesBar) {
    price += PRICES.cocktail.barSetup
  }

  return price
}

// Helper para calcular precio de pastelería
const calculatePastryPrice = (service: Omit<PastryService, 'id' | 'price'>): number => {
  const { items } = service

  const price =
    items.pieLimon * PRICES.pastry.pieLimon +
    items.tartas * PRICES.pastry.tartas +
    items.galletas * PRICES.pastry.galletas +
    items.rollitos * PRICES.pastry.rollitos

  return price
}

export const useBookingStoreMulti = create<BookingStore>((set, get) => ({
  bookingData: initialBookingData,
  currentStep: 1,

  setEventType: (eventType) =>
    set((state) => ({
      bookingData: { ...state.bookingData, eventType },
    })),

  setEventDate: (date) =>
    set((state) => ({
      bookingData: { ...state.bookingData, eventDate: date },
    })),

  setEventTime: (time) =>
    set((state) => ({
      bookingData: { ...state.bookingData, eventTime: time },
    })),

  setDeliveryType: (type) => {
    set((state) => ({
      bookingData: { ...state.bookingData, deliveryType: type },
    }))
    get().calculateTotal()
  },

  setCustomer: (customer) =>
    set((state) => ({
      bookingData: {
        ...state.bookingData,
        customer: { ...state.bookingData.customer, ...customer },
      },
    })),

  addService: (serviceData) => {
    let price = 0

    // Calcular precio según tipo
    if (serviceData.type === 'torta') {
      price = calculateTortaPrice(serviceData as Omit<TortaService, 'id' | 'price'>)
    } else if (serviceData.type === 'cocteleria') {
      price = calculateCocktailPrice(serviceData as Omit<CocktailService, 'id' | 'price'>)
    } else if (serviceData.type === 'pasteleria') {
      price = calculatePastryPrice(serviceData as Omit<PastryService, 'id' | 'price'>)
    }

    const newService: ServiceItem = {
      ...serviceData,
      id: generateId(),
      price,
    } as ServiceItem

    set((state) => ({
      bookingData: {
        ...state.bookingData,
        services: [...state.bookingData.services, newService],
      },
    }))

    get().calculateTotal()
  },

  removeService: (serviceId) => {
    set((state) => ({
      bookingData: {
        ...state.bookingData,
        services: state.bookingData.services.filter((s) => s.id !== serviceId),
      },
    }))
    get().calculateTotal()
  },

  updateService: (serviceId, updates) => {
    set((state) => {
      const services = state.bookingData.services.map((service): ServiceItem => {
        if (service.id !== serviceId) return service

        const updatedService = { ...service, ...updates }

        // Recalcular precio
        let price = 0
        if (updatedService.type === 'torta') {
          price = calculateTortaPrice(updatedService as TortaService)
        } else if (updatedService.type === 'cocteleria') {
          price = calculateCocktailPrice(updatedService as CocktailService)
        } else if (updatedService.type === 'pasteleria') {
          price = calculatePastryPrice(updatedService as PastryService)
        }

        return { ...updatedService, price } as ServiceItem
      })

      return {
        bookingData: {
          ...state.bookingData,
          services,
        },
      }
    })
    get().calculateTotal()
  },

  clearServices: () => {
    set((state) => ({
      bookingData: {
        ...state.bookingData,
        services: [],
      },
    }))
    get().calculateTotal()
  },

  calculateTotal: () => {
    const { services, deliveryType } = get().bookingData

    // Sumar todos los servicios
    const subtotal = services.reduce((sum, service) => sum + service.price, 0)

    // Calcular tarifa de entrega
    const deliveryFee = deliveryType === 'delivery' ? PRICES.delivery : 0

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

// Export de precios para usar en componentes
export { PRICES }
