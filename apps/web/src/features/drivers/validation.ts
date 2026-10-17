import { validateEmail } from '@/features/auth/signup-validation'
import { validateCity, validatePhone } from '@/shared/validation/contact'
import { vehicleTypes } from './types'

/** Espejo de las reglas de Driver Service; el backend es quien decide. */
export const MIN_DRIVER_AGE = 18
export const MAX_NAME = 50
const IDENTIFIER_MIN = 5
const IDENTIFIER_MAX = 20
const PLATE_MIN = 5
const PLATE_MAX = 8
const PASSWORD_MIN = 8
const PASSWORD_MAX_BYTES = 72 // límite de bcrypt en Auth Service

export interface DriverFormValues {
  firstName: string
  lastName: string
  birthDate: string
  phone: string
  city: string
  vehicleType: string
  identifier: string
  plate: string
  email: string
  password: string
}

export type DriverFormErrors = Partial<Record<keyof DriverFormValues, string>>

/** Quita espacios y guiones y pasa a mayúsculas: la forma que se envía. */
function compact(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase()
}

export const normalizeIdentifier = compact
export const normalizePlate = compact

function alphanumericError(value: string, min: number, max: number, label: string): string | undefined {
  if (value === '') return `Ingresa ${label}.`
  if (!/^[A-Z0-9]+$/.test(value) || value.length < min || value.length > max) {
    return `${label[0]?.toUpperCase() ?? ''}${label.slice(1)} admite de ${String(min)} a ${String(max)} letras o números.`
  }
  return undefined
}

export function validateIdentifier(raw: string): string | undefined {
  return alphanumericError(normalizeIdentifier(raw), IDENTIFIER_MIN, IDENTIFIER_MAX, 'el documento de identidad')
}

export function validatePlate(raw: string): string | undefined {
  return alphanumericError(normalizePlate(raw), PLATE_MIN, PLATE_MAX, 'la placa')
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Última fecha de nacimiento válida: hoy menos 18 años. El 29 de febrero rueda al 1 de marzo, como en el backend. */
export function latestBirthDate(today: Date): string {
  return isoDate(new Date(Date.UTC(today.getUTCFullYear() - MIN_DRIVER_AGE, today.getUTCMonth(), today.getUTCDate())))
}

export function validateBirthDate(raw: string, today: Date): string | undefined {
  if (raw === '') return 'Ingresa la fecha de nacimiento.'
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00Z`) : null
  if (!parsed || Number.isNaN(parsed.getTime()) || isoDate(parsed) !== raw) return 'Ingresa una fecha válida.'
  if (raw > latestBirthDate(today)) return `El repartidor debe tener al menos ${String(MIN_DRIVER_AGE)} años.`
  return undefined
}

function validateNamePart(raw: string, label: string): string | undefined {
  const value = raw.trim()
  if (value === '') return `Ingresa ${label}.`
  if (Array.from(value).length > MAX_NAME) return `${label[0]?.toUpperCase() ?? ''}${label.slice(1)} admite hasta ${String(MAX_NAME)} caracteres.`
  return undefined
}

function validatePassword(raw: string): string | undefined {
  if (raw.trim() === '') return 'Ingresa la contraseña inicial.'
  if (raw.length < PASSWORD_MIN) return `La contraseña necesita al menos ${String(PASSWORD_MIN)} caracteres.`
  if (new TextEncoder().encode(raw).length > PASSWORD_MAX_BYTES) return `La contraseña admite hasta ${String(PASSWORD_MAX_BYTES)} bytes.`
  return undefined
}

/** Valida todo el formulario. `today` se inyecta para que las pruebas no dependan del reloj. */
export function validateDriverForm(values: DriverFormValues, today: Date): DriverFormErrors {
  const candidates: Record<keyof DriverFormValues, string | undefined> = {
    firstName: validateNamePart(values.firstName, 'el nombre'),
    lastName: validateNamePart(values.lastName, 'el apellido'),
    birthDate: validateBirthDate(values.birthDate, today),
    phone: validatePhone(values.phone, 'Ingresa el teléfono de contacto.'),
    city: validateCity(values.city),
    vehicleType: (vehicleTypes as readonly string[]).includes(values.vehicleType) ? undefined : 'Elige el tipo de vehículo.',
    identifier: validateIdentifier(values.identifier),
    plate: validatePlate(values.plate),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
  }
  return Object.fromEntries(Object.entries(candidates).filter(([, message]) => message !== undefined))
}
