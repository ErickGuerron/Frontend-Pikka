import {
  normalizePhone,
  sanitizeDateInput,
  stripEmoji,
  sanitizePhoneInput,
  validateCity,
  validatePhone,
  validatePostalCode,
  validateReference,
} from '../src/features/contact/validation'

describe('contact validation', () => {
  it('normalizes phones by stripping spaces, hyphens, dots and parentheses', () => {
    expect(normalizePhone('+59 (99) 123-4567')).toBe('+59991234567')
    expect(normalizePhone('099.123.4567')).toBe('0991234567')
  })

  it.each(['0991234567', '099 123 4567', '(022) 245-6789'])('accepts phone %p', (phone) => {
    expect(validatePhone(phone)).toBeUndefined()
  })

  it.each(['', '   ', '123456', '123456789', '12345678901', '+0991234567', '12ab567890', '++5939912345'])('rejects phone %p', (phone) => {
    expect(validatePhone(phone)).toBeDefined()
  })

  it('uses the given required message for an empty phone', () => {
    expect(validatePhone('', 'Falta el teléfono')).toBe('Falta el teléfono')
  })

  it('sanitizes typing: digits, spaces, hyphens and a leading plus, max 10 digits', () => {
    expect(sanitizePhoneInput('+59a3 99-12x')).toBe('5939912')
    expect(sanitizePhoneInput('1'.repeat(30))).toHaveLength(10)
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

describe('input guards', () => {
  it('strips emojis but keeps text and digits', () => {
    expect(stripEmoji('Hola 😀 mundo 👨‍👩‍👧 5️⃣ 12')).toBe('Hola  mundo  5 12')
  })

  it('limits dates to digits and hyphens, 10 chars', () => {
    expect(sanitizeDateInput('2026/12-31abc99')).toBe('202612-319')
    expect(sanitizeDateInput('2026-12-31-99')).toBe('2026-12-31')
  })

  it('rejects whitespace-only required fields', () => {
    expect(validatePhone('   ')).toBeDefined()
    expect(validateCity('   ')).toBeDefined()
    expect(validateReference('     ')).toBeDefined()
  })
})
