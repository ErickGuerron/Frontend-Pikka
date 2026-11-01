import { validateCity, validatePhone } from '../contact/validation'

// Client-side policy only: the backend enforces just fullName 1-120, email <= 254, password 8-72 bytes, phone and city.
const MAX_FULL_NAME = 120
// Two parts joined by one space must stay within MAX_FULL_NAME: 59 + 1 + 59 = 119.
export const MAX_NAME_PART = 59
const MAX_EMAIL_LENGTH = 254
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_BYTES = 72 // bcrypt limit enforced by the backend

export interface SignupValues {
  nombre: string
  apellido: string
  city: string
  phone: string
  email: string
  password: string
  confirm: string
}

export type SignupErrors = Partial<Record<keyof SignupValues, string>>

/** Submitted full name: both parts are single words, joined by one space. */
export function joinFullName(nombre: string, apellido: string): string {
  return `${nombre} ${apellido}`
}

const lettersOnly = /^\p{L}+$/u

function validateNamePart(value: string, requiredMessage: string): string | undefined {
  if (value.length === 0) return requiredMessage
  if (!lettersOnly.test(value)) return 'Solo letras, sin espacios ni números.'
  if (Array.from(value).length > MAX_NAME_PART) {
    return `Admite hasta ${String(MAX_NAME_PART)} letras.`
  }
  return undefined
}

function validateEmail(raw: string): string | undefined {
  const email = raw.trim()
  if (email.length === 0) return 'Ingresa tu correo electrónico.'
  if (email.length > MAX_EMAIL_LENGTH) return `El correo admite hasta ${String(MAX_EMAIL_LENGTH)} caracteres.`
  if (/\s/.test(email)) return 'El correo no puede contener espacios.'
  const parts = email.split('@')
  const [local, domain] = parts
  const shape = 'Ingresa un correo válido, por ejemplo nombre@dominio.com.'
  if (parts.length !== 2 || !local || !domain) return shape
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return shape
  // A dot in the domain is required; empty labels cover leading, trailing and consecutive dots.
  const labels = domain.split('.')
  if (labels.length < 2 || labels.some((label) => label.length === 0)) return shape
  return undefined
}

export type PasswordRuleId = 'length' | 'upper' | 'lower' | 'digit' | 'special' | 'noSpaces' | 'maxBytes'

export interface PasswordRule {
  id: PasswordRuleId
  label: string
  met: boolean
}

/** Evaluates every password rule; the UI only lists unmet ones after a submit attempt. */
export function evaluatePasswordRules(password: string): PasswordRule[] {
  const bytes = new TextEncoder().encode(password).length
  return [
    { id: 'length', label: `Al menos ${String(MIN_PASSWORD_LENGTH)} caracteres`, met: Array.from(password).length >= MIN_PASSWORD_LENGTH },
    { id: 'upper', label: 'Una letra mayúscula', met: /\p{Lu}/u.test(password) },
    { id: 'lower', label: 'Una letra minúscula', met: /\p{Ll}/u.test(password) },
    { id: 'digit', label: 'Un número', met: /\d/.test(password) },
    { id: 'special', label: 'Un carácter especial (por ejemplo ! @ # $ %)', met: /[^\p{L}\p{N}\s]/u.test(password) },
    { id: 'noSpaces', label: 'Sin espacios', met: !/\s/.test(password) },
    // Silent guard (backend limit is 72 bytes): only surfaced in the submit-time "Falta:" message.
    { id: 'maxBytes', label: 'Una contraseña más corta', met: bytes <= MAX_PASSWORD_BYTES },
  ]
}

/** Message listing the unmet rules, or undefined when every rule passes. */
export function missingPasswordRulesMessage(password: string): string | undefined {
  const missing = evaluatePasswordRules(password)
    .filter((rule) => !rule.met)
    .map((rule) => rule.label.charAt(0).toLowerCase() + rule.label.slice(1))
  return missing.length === 0 ? undefined : `Falta: ${missing.join(', ')}.`
}

export function passwordMeetsPolicy(password: string): boolean {
  return evaluatePasswordRules(password).every((rule) => rule.met)
}

/** Mirrors the backend limits and adds the stricter client-side policy. */
export function validateSignup(values: SignupValues): SignupErrors {
  const errors: SignupErrors = {}
  const nombre = validateNamePart(values.nombre, 'Ingresa tu nombre.')
  if (nombre) errors.nombre = nombre
  const apellido = validateNamePart(values.apellido, 'Ingresa tu apellido.')
  if (apellido) errors.apellido = apellido
  // Defensive: the joined value must always fit the backend limit.
  if (!nombre && !apellido && Array.from(joinFullName(values.nombre, values.apellido)).length > MAX_FULL_NAME) {
    errors.apellido = 'El nombre completo admite hasta 120 caracteres.'
  }

  const city = validateCity(values.city)
  if (city) errors.city = city
  const phone = validatePhone(values.phone, 'Ingresa tu número de teléfono.')
  if (phone) errors.phone = phone

  const email = validateEmail(values.email)
  if (email) errors.email = email

  const password = missingPasswordRulesMessage(values.password)
  if (password) errors.password = password
  if (values.confirm !== values.password) errors.confirm = 'Las contraseñas no coinciden.'
  return errors
}
