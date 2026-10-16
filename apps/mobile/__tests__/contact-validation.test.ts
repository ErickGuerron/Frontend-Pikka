import {
  normalizePhone,
  sanitizePhoneInput,
  validateCity,
  validatePhone,
  validatePostalCode,
  validateReference,
} from '../src/features/contact/validation'

describe('contact validation', () => {
  it('normalizes phones by stripping spaces, hyphens, dots and parentheses', () => {
    expect(normalizePhone('+593 (99) 123-4567')).toBe('+593991234567')
    expect(normalizePhone('099.123.4567')).toBe('0991234567')
  })

  it.each(['0991234567', '+593 99 123 4567', '(02) 245-6789'])('accepts phone %p', (phone) => {
    expect(validatePhone(phone)).toBeUndefined()
  })

  it.each(['', '   ', '123456', '1234567890123456', '12ab567890', '++5939912345'])('rejects phone %p', (phone) => {
    expect(validatePhone(phone)).toBeDefined()
  })

  it('uses the given required message for an empty phone', () => {
    expect(validatePhone('', 'Falta el teléfono')).toBe('Falta el teléfono')
  })

  it('sanitizes typing: digits, spaces, hyphens and a leading plus, max 20', () => {
    expect(sanitizePhoneInput('+59a3 99-12x')).toBe('+593 99-12')
    expect(sanitizePhoneInput('1'.repeat(30))).toHaveLength(20)
  })

  it('validates city 2..80 chars', () => {
    expect(validateCity('Quito')).toBeUndefined()
    expect(validateCity('')).toBeDefined()
    expect(validateCity('Q')).toBeDefined()
    expect(validateCity('x'.repeat(81))).toBeDefined()
    expect(validateCity('x'.repeat(80))).toBeUndefined()
  })

  it('validates reference 3..200 chars', () => {
    expect(validateReference('')).toBeDefined()
    expect(validateReference('ab')).toBeDefined()
    expect(validateReference('casa azul')).toBeUndefined()
    expect(validateReference('x'.repeat(201))).toBeDefined()
  })

  it('validates an optional postal code of 4..10 letters, digits or hyphens', () => {
    expect(validatePostalCode('')).toBeUndefined()
    expect(validatePostalCode('170150')).toBeUndefined()
    expect(validatePostalCode('EC-1701')).toBeUndefined()
    expect(validatePostalCode('123')).toBeDefined()
    expect(validatePostalCode('12345678901')).toBeDefined()
    expect(validatePostalCode('17 01')).toBeDefined()
  })
})
