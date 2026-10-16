import type { Coordinate } from '@/features/geo/types'
import { validatePhone, validatePostalCode, validateReference } from '@/shared/validation/contact'
import { MAX_LINE_QUANTITY, type NewOrder } from './types'

/** Campos de texto del pedido, sin la ubicación del mapa ni los productos. */
export type OrderFields = Omit<
  NewOrder,
  'latitude' | 'longitude' | 'items' | 'addressReference' | 'postalCode' | 'contactPhone'
>

/** Pedido en edición: la ubicación puede faltar hasta que el usuario la elija en el mapa. */
export interface OrderDraft extends OrderFields {
  location: Coordinate | null
  /** Solo al crear; la corrección de un pedido en revisión no toca los productos. */
  items?: NewOrder['items']
  /** Datos de contacto: solo al crear; la corrección de un pedido en revisión no los toca. */
  addressReference?: string
  postalCode?: string
  contactPhone?: string
}

export type OrderErrors = Partial<Record<keyof OrderDraft, string>>

const MIN_ADDRESS_LENGTH = 5
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

/**
 * Valida un pedido antes de enviarlo. `today` (YYYY-MM-DD, hora local) se recibe
 * como parámetro para que la regla de fecha sea determinista en las pruebas.
 */
export function validateNewOrder(input: OrderDraft, today: string): OrderErrors {
  const errors: OrderErrors = {}

  if (input.address.trim().length < MIN_ADDRESS_LENGTH) {
    errors.address = `Escribe la dirección completa (mínimo ${String(MIN_ADDRESS_LENGTH)} caracteres).`
  }

  const { items } = input
  if (items !== undefined) {
    if (items.length === 0) {
      errors.items = 'Elige al menos un producto.'
    } else if (
      items.some((line) => !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_LINE_QUANTITY) ||
      new Set(items.map((line) => line.productId)).size !== items.length
    ) {
      errors.items = `Cada producto va una sola vez, de 1 a ${String(MAX_LINE_QUANTITY)} unidades.`
    }
  }

  if (input.addressReference !== undefined) {
    const reference = validateReference(input.addressReference)
    if (reference !== undefined) errors.addressReference = reference
  }
  if (input.postalCode !== undefined) {
    const postal = validatePostalCode(input.postalCode)
    if (postal !== undefined) errors.postalCode = postal
  }
  if (input.contactPhone !== undefined) {
    const phone = validatePhone(input.contactPhone)
    if (phone !== undefined) errors.contactPhone = phone
  }

  if (input.location === null) {
    errors.location = 'Elige la ubicación de entrega en el mapa.'
  } else if (!isValidLocation(input.location)) {
    errors.location = 'La ubicación elegida no es válida. Vuelve a seleccionarla en el mapa.'
  }

  if (input.deliveryDate === '') {
    errors.deliveryDate = 'Elige la fecha de entrega.'
  } else if (input.deliveryDate < today) {
    errors.deliveryDate = 'La fecha de entrega no puede ser anterior a hoy.'
  }

  const startOk = TIME_PATTERN.test(input.windowStart)
  const endOk = TIME_PATTERN.test(input.windowEnd)
  if (!startOk) {
    errors.windowStart = 'Indica la hora de inicio (HH:mm).'
  }
  if (!endOk) {
    errors.windowEnd = 'Indica la hora de fin (HH:mm).'
  }
  if (startOk && endOk && input.windowEnd <= input.windowStart) {
    errors.windowEnd = 'La hora de fin debe ser posterior a la de inicio.'
  }

  return errors
}

/** Latitud y longitud dentro de los rangos WGS 84 que exige el contrato. */
export function isValidLocation(point: Coordinate): boolean {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    point.longitude >= -180 &&
    point.longitude <= 180
  )
}

/** Fecha local actual en formato YYYY-MM-DD, compatible con <input type="date">. */
export function localToday(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${String(y)}-${m}-${d}`
}
