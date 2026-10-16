import { describe, expect, it } from 'vitest'
import { normalizePhone, sanitizePhoneInput, validateCity, validatePhone, validatePostalCode, validateReference } from './contact'

describe('teléfono', () => {
  it('normaliza espacios, guiones, puntos y paréntesis', () => {
    expect(normalizePhone('+593 99-123.4567')).toBe('+593991234567')
    expect(normalizePhone('(02) 255 1234')).toBe('022551234')
  })

  it('acepta 7 a 15 dígitos con "+" opcional', () => {
    expect(validatePhone('0991234567')).toBeUndefined()
    expect(validatePhone('+593 99 123 4567')).toBeUndefined()
  })

  it('rechaza vacío, letras y largos fuera de rango', () => {
    expect(validatePhone('')).toMatch(/teléfono de contacto/)
    expect(validatePhone('12345')).toMatch(/válido/)
    expect(validatePhone('abc1234567')).toMatch(/válido/)
    expect(validatePhone('1234567890123456')).toMatch(/válido/)
  })

  it('al escribir descarta letras y símbolos y limita a 20 caracteres', () => {
    expect(sanitizePhoneInput('+59a3 9b9-1')).toBe('+593 99-1')
    expect(sanitizePhoneInput('1'.repeat(30))).toHaveLength(20)
  })
})

describe('ciudad, referencia y código postal', () => {
  it('la ciudad exige de 2 a 80 caracteres', () => {
    expect(validateCity('')).toBeDefined()
    expect(validateCity('Q')).toBeDefined()
    expect(validateCity('Quito')).toBeUndefined()
    expect(validateCity('x'.repeat(81))).toBeDefined()
  })

  it('la referencia es obligatoria, de 3 a 200 caracteres', () => {
    expect(validateReference('  ')).toMatch(/referencia/)
    expect(validateReference('ab')).toBeDefined()
    expect(validateReference('Casa azul junto a la tienda')).toBeUndefined()
    expect(validateReference('x'.repeat(201))).toBeDefined()
  })

  it('el código postal es opcional pero, si se escribe, de 4 a 10 caracteres válidos', () => {
    expect(validatePostalCode('')).toBeUndefined()
    expect(validatePostalCode('170150')).toBeUndefined()
    expect(validatePostalCode('SW1A-1AA')).toBeUndefined()
    expect(validatePostalCode('12')).toBeDefined()
    expect(validatePostalCode('12 34')).toBeDefined()
    expect(validatePostalCode('1'.repeat(11))).toBeDefined()
  })
})
