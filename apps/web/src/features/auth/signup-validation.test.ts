import { describe, expect, it } from 'vitest'
import { evaluatePasswordRules, missingPasswordRulesMessage, validateSignup, type SignupValues } from './signup-validation'

const valid: SignupValues = {
  nombre: 'Carla',
  apellido: 'Cliente',
  city: 'Quito',
  phone: '0991234567',
  email: 'c@x.co',
  password: 'Clave-segura1',
  confirm: 'Clave-segura1',
}

const withValues = (patch: Partial<SignupValues>): SignupValues => ({ ...valid, ...patch })

describe('validateSignup', () => {
  it('accepts valid data', () => {
    expect(validateSignup(valid)).toEqual({})
  })

  it('requires city and a valid phone', () => {
    expect(validateSignup(withValues({ city: '' })).city).toBe('Ingresa tu ciudad.')
    expect(validateSignup(withValues({ phone: '' })).phone).toBe('Ingresa tu número de teléfono.')
    expect(validateSignup(withValues({ phone: '12ab' })).phone).toMatch(/válido/)
    expect(validateSignup(withValues({ phone: '+593 99 123 4567' })).phone).toBeUndefined()
  })

  describe('nombre / apellido', () => {
    it.each(['María', 'Ñandú', 'Müller', 'José'])('accepts %s', (name) => {
      expect(validateSignup(withValues({ nombre: name, apellido: name }))).toEqual({})
    })

    it.each(['Ana María', 'Ana2', 'Ana_', 'Ana-Luz', 'Ana.', ' Ana'])('rejects %j', (name) => {
      expect(validateSignup(withValues({ nombre: name })).nombre).toBe('Solo letras, sin espacios ni números.')
      expect(validateSignup(withValues({ apellido: name })).apellido).toBe('Solo letras, sin espacios ni números.')
    })

    it('requires both fields', () => {
      expect(validateSignup(withValues({ nombre: '' })).nombre).toBe('Ingresa tu nombre.')
      expect(validateSignup(withValues({ apellido: '' })).apellido).toBe('Ingresa tu apellido.')
    })

    it('keeps the joined full name within 120 characters', () => {
      const max = 'a'.repeat(59)
      expect(validateSignup(withValues({ nombre: max, apellido: max }))).toEqual({})
      expect(validateSignup(withValues({ nombre: 'a'.repeat(60) })).nombre).toBeDefined()
      expect(validateSignup(withValues({ apellido: 'a'.repeat(60) })).apellido).toBeDefined()
    })
  })

  describe('email', () => {
    it.each(['c@x.co', 'a.b+tag@mail.example.com', 'ñandu@correo.es'])('accepts %s', (email) => {
      expect(validateSignup(withValues({ email })).email).toBeUndefined()
    })

    it('trims surrounding whitespace', () => {
      expect(validateSignup(withValues({ email: '  c@x.co  ' })).email).toBeUndefined()
    })

    it.each([
      ['', 'empty'],
      ['sin-arroba', 'no at sign'],
      ['a@b', 'no dot in domain'],
      ['a b@x.co', 'inner space'],
      ['a@x .co', 'space in domain'],
      ['a..b@x.co', 'consecutive dots in local part'],
      ['a@x..co', 'consecutive dots in domain'],
      ['.a@x.co', 'leading dot'],
      ['a.@x.co', 'trailing dot in local part'],
      ['a@.x.co', 'domain starting with dot'],
      ['a@x.co.', 'domain ending with dot'],
      ['a@@x.co', 'two at signs'],
      ['@x.co', 'no local part'],
      [`${'a'.repeat(250)}@x.co`, 'longer than 254'],
    ])('rejects %j (%s)', (email) => {
      expect(validateSignup(withValues({ email })).email).toBeDefined()
    })

    it('accepts exactly 254 characters', () => {
      const email = `${'a'.repeat(64)}@${'b'.repeat(60)}.${'c'.repeat(60)}.${'d'.repeat(64)}.co`
      expect(email.length).toBe(254)
      expect(validateSignup(withValues({ email })).email).toBeUndefined()
    })
  })

  describe('password', () => {
    const pass = (password: string) => validateSignup(withValues({ password, confirm: password })).password

    it('accepts a password meeting every rule', () => {
      expect(pass('Abcdef1!')).toBeUndefined()
    })

    it.each([
      ['Ab1!', 'too short'],
      ['abcdefg1!', 'no uppercase'],
      ['ABCDEFG1!', 'no lowercase'],
      ['Abcdefgh!', 'no digit'],
      ['Abcdefg12', 'no special character'],
      ['Abcd efg1!', 'contains a space'],
    ])('rejects %j (%s)', (password) => {
      expect(pass(password)).toBeDefined()
    })

    it('limits the password to 72 bytes', () => {
      const base = 'Aa1!'
      expect(pass(base + 'a'.repeat(68))).toBeUndefined()
      expect(pass(base + 'a'.repeat(69))).toBeDefined()
      // 35 two-byte chars = 70 bytes + 4 = 74 bytes (fewer than 72 characters)
      expect(pass(base + 'ñ'.repeat(35))).toBeDefined()
    })
  })

  it('requires the confirmation to match', () => {
    expect(validateSignup(withValues({ confirm: 'Otra-clave1' })).confirm).toBeDefined()
  })
})

describe('evaluatePasswordRules', () => {
  const unmet = (password: string) => evaluatePasswordRules(password).filter((r) => !r.met).map((r) => r.id)

  it('reports every rule as unmet for an empty password', () => {
    expect(unmet('')).toEqual(['length', 'upper', 'lower', 'digit', 'special'])
  })

  it('reports each rule independently', () => {
    expect(unmet('abcdefgh')).toEqual(['upper', 'digit', 'special'])
    expect(unmet('Abcdefg1!')).toEqual([])
    expect(unmet('Abc def1!')).toEqual(['noSpaces'])
    expect(unmet('Aa1!' + 'a'.repeat(69))).toEqual(['maxBytes'])
  })

  it('uses a plain-language label for the byte limit', () => {
    const rule = evaluatePasswordRules('').find((r) => r.id === 'maxBytes')
    expect(rule?.label).toBe('Una contraseña más corta')
  })

  it('exposes a Spanish label for each rule', () => {
    for (const rule of evaluatePasswordRules('')) expect(rule.label.length).toBeGreaterThan(3)
  })
})

describe('missingPasswordRulesMessage', () => {
  it('lists only the unmet rules with lowercase labels', () => {
    expect(missingPasswordRulesMessage('abc')).toBe(
      'Falta: al menos 8 caracteres, una letra mayúscula, un número, un carácter especial (por ejemplo ! @ # $ %).',
    )
  })

  it('mentions spaces and length only when violated', () => {
    expect(missingPasswordRulesMessage('Abc def1!')).toBe('Falta: sin espacios.')
    expect(missingPasswordRulesMessage('Aa1!' + 'a'.repeat(69))).toBe('Falta: una contraseña más corta.')
  })

  it('returns undefined when every rule passes', () => {
    expect(missingPasswordRulesMessage('Clave-segura1')).toBeUndefined()
  })

  it('is used as the password error by validateSignup', () => {
    expect(validateSignup(withValues({ password: 'abc', confirm: 'abc' })).password).toMatch(/^Falta: /)
  })
})
