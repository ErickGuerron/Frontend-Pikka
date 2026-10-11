import {
  evaluatePasswordRules,
  joinFullName,
  missingPasswordRulesMessage,
  passwordMeetsPolicy,
  validateSignup,
} from '../src/features/auth/signup-validation'

const valid = { nombre: 'María', apellido: 'Núñez', email: 'maria@pikka.com', password: 'Abcdef1!', confirm: 'Abcdef1!' }

describe('signup validation', () => {
  it('accepts valid values', () => {
    expect(validateSignup(valid)).toEqual({})
  })

  it.each(['Ana Maria', 'Ana1', 'Ana-', ''])('rejects invalid nombre %p', (nombre) => {
    expect(validateSignup({ ...valid, nombre }).nombre).toBeDefined()
  })

  it.each(['a@b', 'a b@c.com', 'a@@c.com', 'a@c..com', '.a@c.com', ''])('rejects invalid email %p', (email) => {
    expect(validateSignup({ ...valid, email }).email).toBeDefined()
  })

  it('reports missing password rules with a Falta: message', () => {
    expect(missingPasswordRulesMessage('abc')).toMatch(/^Falta: /)
    expect(missingPasswordRulesMessage('Abcdef1!')).toBeUndefined()
  })

  it('requires confirmation to match', () => {
    expect(validateSignup({ ...valid, confirm: 'other' }).confirm).toBe('Las contraseñas no coinciden.')
  })

  it('rejects spaces and more than 72 bytes', () => {
    expect(passwordMeetsPolicy('Abcdef1! x')).toBe(false)
    expect(passwordMeetsPolicy(`Aa1!${'é'.repeat(40)}`)).toBe(false)
    expect(evaluatePasswordRules('Abcdef1!').every((r) => r.met)).toBe(true)
  })

  it('joins the full name with one space', () => {
    expect(joinFullName('Ana', 'Lopez')).toBe('Ana Lopez')
  })
})
