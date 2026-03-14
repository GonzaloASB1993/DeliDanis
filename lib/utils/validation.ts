// Biblioteca de validaciones para formularios
// Patrón basado en ContactForm.tsx - Sin dependencias externas

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Valida formato de email
 * Patrón: nombre@dominio.extension
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim()

  if (!trimmed) {
    return { isValid: false, error: 'El email es requerido' }
  }

  // Regex simple pero efectiva para emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Email inválido' }
  }

  return { isValid: true }
}

/**
 * Valida formato de teléfono chileno
 * Formatos aceptados:
 * - +56 9 1234 5678
 * - +56912345678
 * - 912345678
 * - 9 1234 5678
 */
export function validatePhone(phone: string): ValidationResult {
  const trimmed = phone.trim()

  if (!trimmed) {
    return { isValid: false, error: 'El teléfono es requerido' }
  }

  // Remover espacios y guiones para validar
  const cleaned = trimmed.replace(/[\s\-()]/g, '')

  // Debe contener solo dígitos y opcionalmente el prefijo +56
  const phoneRegex = /^(\+?56)?9\d{8}$/

  if (!phoneRegex.test(cleaned)) {
    return { isValid: false, error: 'Teléfono inválido. Formato: +56 9 XXXX XXXX' }
  }

  return { isValid: true }
}

/**
 * Valida nombres (nombre o apellido)
 * - Solo letras, espacios, acentos y ñ
 * - Mínimo 2 caracteres
 * - Sin números ni caracteres especiales
 */
export function validateName(name: string, fieldName: string = 'nombre'): ValidationResult {
  const trimmed = name.trim()

  if (!trimmed) {
    return { isValid: false, error: `El ${fieldName} es requerido` }
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: `El ${fieldName} debe tener al menos 2 caracteres` }
  }

  // Solo letras (incluye acentos y ñ), espacios, guiones y apóstrofes
  const nameRegex = /^[a-záéíóúñü\s'-]+$/i

  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: `El ${fieldName} solo puede contener letras` }
  }

  return { isValid: true }
}

/**
 * Valida dirección (cuando delivery está seleccionado)
 */
export function validateAddress(address: string): ValidationResult {
  const trimmed = address.trim()

  if (!trimmed) {
    return { isValid: false, error: 'La dirección es requerida' }
  }

  if (trimmed.length < 5) {
    return { isValid: false, error: 'La dirección debe ser más específica (mínimo 5 caracteres)' }
  }

  return { isValid: true }
}

/**
 * Valida ciudad
 */
export function validateCity(city: string): ValidationResult {
  const trimmed = city.trim()

  if (!trimmed) {
    return { isValid: false, error: 'La ciudad es requerida' }
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'La ciudad debe tener al menos 2 caracteres' }
  }

  // Solo letras, espacios y acentos
  const cityRegex = /^[a-záéíóúñü\s'-]+$/i

  if (!cityRegex.test(trimmed)) {
    return { isValid: false, error: 'La ciudad solo puede contener letras' }
  }

  return { isValid: true }
}

/**
 * Validador genérico de campos requeridos
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
  const trimmed = value.trim()

  if (!trimmed) {
    return { isValid: false, error: `${fieldName} es requerido` }
  }

  return { isValid: true }
}
