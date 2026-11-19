/** Reglas de datos de contacto: espejo de las del backend (signup y pedidos). */

export const CITY_MIN = 2
export const CITY_MAX = 80
export const REFERENCE_MIN = 3
export const REFERENCE_MAX = 200
export const POSTAL_MIN = 4
export const POSTAL_MAX = 10

export const PHONE_DIGITS = 10
const phonePattern = /^[0-9]{10}$/
const postalPattern = /^[A-Za-z0-9-]+$/

/** Quita espacios, guiones, puntos y paréntesis: la forma que se envía al backend. */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-.()]/g, '')
}

/** Deja escribir solo dígitos, hasta 10. */
export function sanitizePhoneInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, PHONE_DIGITS)
}

/** Quita emojis y sus marcas de unión: ningún campo de texto los admite. */
export function stripEmoji(raw: string): string {
  return raw.replace(/\p{Extended_Pictographic}|\p{Emoji_Presentation}|\u200d|\ufe0f|\u20e3/gu, '')
}

/** Nombre y apellido: solo letras, sin espacios. */
export function sanitizeNameInput(raw: string): string {
  return raw.replace(/[^\p{L}]/gu, '')
}

export function validatePhone(raw: string, requiredMessage = 'Ingresa un teléfono de contacto.'): string | undefined {
  const value = normalizePhone(raw.trim())
  if (value === '') return requiredMessage
  if (!phonePattern.test(value)) return 'Ingresa un teléfono válido de 10 dígitos.'
  return undefined
}

export function validateCity(raw: string): string | undefined {
  const value = raw.trim()
  if (value === '') return 'Ingresa tu ciudad.'
  const length = Array.from(value).length
  if (length < CITY_MIN || length > CITY_MAX) return `La ciudad debe tener entre ${String(CITY_MIN)} y ${String(CITY_MAX)} caracteres.`
  return undefined
}

export function validateReference(raw: string): string | undefined {
  const value = raw.trim()
  if (value === '') return 'Indica una referencia del lugar (por ejemplo, "casa azul, junto a la tienda").'
  const length = Array.from(value).length
  if (length < REFERENCE_MIN || length > REFERENCE_MAX) {
    return `La referencia debe tener entre ${String(REFERENCE_MIN)} y ${String(REFERENCE_MAX)} caracteres.`
  }
  return undefined
}

/** Opcional: vacío es válido. */
export function validatePostalCode(raw: string): string | undefined {
  const value = raw.trim()
  if (value === '') return undefined
  if (value.length < POSTAL_MIN || value.length > POSTAL_MAX || !postalPattern.test(value)) {
    return `El código postal admite de ${String(POSTAL_MIN)} a ${String(POSTAL_MAX)} letras, números o guiones.`
  }
  return undefined
}
