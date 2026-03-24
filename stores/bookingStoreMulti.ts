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

// Servicio de Coctelería (sistema de selección de productos)
export interface CocktailService {
  type: 'cocteleria'
  items: Record<string, number> // productId: quantity
  itemsDetails?: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    imageUrl?: string | null
  }>
  specialRequests?: string
  price: number
}

// Servicio de Pastelería (nuevo formato con productos de BD)
export interface PastryService {
  type: 'pasteleria'
  items: Record<string, number> // productId: quantity
  itemsDetails?: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    imageUrl?: string | null
  }>
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

// Helper para calcular precio de coctelería (basado en productos individuales)
const calculateCocktailPrice = (service: Omit<CocktailService, 'id' | 'price'>): number => {
  const { items } = service

  // Precios de productos de coctelería (deben coincidir con CocktailServiceForm)
  const productPrices: Record<string, number> = {
    // Dulces - Mini Pies
    '1': 3500,  // Mini Pie de Limón
    '2': 3500,  // Mini Pie de Manzana
    '3': 3800,  // Mini Pie de Frutillas
    // Dulces - Mini Cheesecakes
    '4': 4000,  // Mini Cheesecake Frutos Rojos
    '5': 4200,  // Mini Cheesecake Oreo
    '6': 4000,  // Mini Cheesecake Maracuyá
    // Dulces - Bocados
    '7': 3000,  // Profiteroles
    '8': 4500,  // Macarons
    '9': 3500,  // Trufas
    '10': 3000, // Alfajores
    // Salados - Tapaditos
    '11': 2500, // Tapaditos Jamón y Queso
    '12': 2500, // Tapaditos Pollo
    '13': 2800, // Tapaditos Atún
    '14': 2500, // Tapaditos Vegetales
    // Salados - Mini Hamburguesas
    '15': 3500, // Mini Hamburguesa Clásica
    '16': 3800, // Mini Hamburguesa BBQ
    '17': 3500, // Mini Hamburguesa Pollo
    // Salados - Croissants
    '18': 3500, // Mini Croissant Jamón y Queso
    '19': 3800, // Mini Croissant Pollo Champiñones
    // Salados - Empanadas
    '20': 2800, // Empanada de Pino
    '21': 2500, // Empanada de Queso
    '22': 2800, // Empanada Napolitana
    // Salados - Otros
    '23': 2500, // Tequeños
    '24': 4000, // Canapés Variados
    '25': 3500, // Quiches Individuales
  }

  return Object.entries(items).reduce((sum, [productId, quantity]) => {
    const price = productPrices[productId] || 0
    return sum + (price * quantity)
  }, 0)
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

    // Si viene un precio pre-calculado del formulario, usarlo
    const dataWithPrice = serviceData as any
    if (dataWithPrice.calculatedPrice !== undefined) {
      price = dataWithPrice.calculatedPrice
    } else {
      // Calcular precio según tipo (fallback)
      if (serviceData.type === 'torta') {
        price = calculateTortaPrice(serviceData as Omit<TortaService, 'id' | 'price'>)
      } else if (serviceData.type === 'cocteleria') {
        price = calculateCocktailPrice(serviceData as Omit<CocktailService, 'id' | 'price'>)
      } else if (serviceData.type === 'pasteleria') {
        price = calculatePastryPrice(serviceData as Omit<PastryService, 'id' | 'price'>)
      }
    }

    // Limpiar calculatedPrice antes de guardar
    const { calculatedPrice, ...cleanServiceData } = dataWithPrice

    const newService: ServiceItem = {
      ...cleanServiceData,
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
      currentStep: Math.min(state.currentStep + 1, 5),
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
