import type { NewOrder } from './types'

export type OrderErrors = Partial<Record<keyof NewOrder, string>>

const MIN_ADDRESS_LENGTH = 5
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

/**
 * Valida un pedido antes de enviarlo. `today` (YYYY-MM-DD, hora local) se recibe
 * como parámetro para que la regla de fecha sea determinista en las pruebas.
 */
export function validateNewOrder(input: NewOrder, today: string): OrderErrors {
  const errors: OrderErrors = {}

  if (input.address.trim().length < MIN_ADDRESS_LENGTH) {
    errors.address = `Escribe la dirección completa (mínimo ${String(MIN_ADDRESS_LENGTH)} caracteres).`
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

/** Fecha local actual en formato YYYY-MM-DD, compatible con <input type="date">. */
export function localToday(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${String(y)}-${m}-${d}`
}
