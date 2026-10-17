import { describe, expect, it } from 'vitest'
import {
  latestBirthDate,
  normalizeIdentifier,
  normalizePlate,
  validateBirthDate,
  validateDriverForm,
  validateIdentifier,
  validatePlate,
  type DriverFormValues,
} from './validation'

const today = new Date(Date.UTC(2026, 9, 16)) // 2026-10-16

const valid: DriverFormValues = {
  firstName: 'Lucas',
  lastName: 'Martinez',
  birthDate: '1999-03-15',
  phone: '0987654321',
  city: 'Quito',
  vehicleType: 'MOTORIZADO',
  identifier: '1712345678',
  plate: 'PBA-1234',
  email: 'lucas@example.com',
  password: 'password123',
}

describe('fecha de nacimiento', () => {
  it('la última fecha válida es hoy menos 18 años', () => {
    expect(latestBirthDate(today)).toBe('2008-10-16')
  })

  it('acepta exactamente 18 años y rechaza un día menos', () => {
    expect(validateBirthDate('2008-10-16', today)).toBeUndefined()
    expect(validateBirthDate('2008-10-17', today)).toMatch(/18/)
  })

  it('rechaza vacío, mal formado, inexistente y futuro', () => {
    expect(validateBirthDate('', today)).toBeTruthy()
    expect(validateBirthDate('15/03/1999', today)).toBeTruthy()
    expect(validateBirthDate('1999-02-31', today)).toBeTruthy()
    expect(validateBirthDate('2030-01-01', today)).toBeTruthy()
  })

  it('el 29 de febrero se trata como el backend: cumple 18 el 1 de marzo', () => {
    const leapDay = new Date(Date.UTC(2028, 1, 29))
    expect(latestBirthDate(leapDay)).toBe('2010-03-01')
  })
})

describe('identificador y placa', () => {
  it('normalizan a mayúsculas sin espacios ni guiones', () => {
    expect(normalizeIdentifier(' 17-1234 5678 ')).toBe('1712345678')
    expect(normalizePlate('pba-1234')).toBe('PBA1234')
  })

  it('el identificador admite de 5 a 20 letras o dígitos', () => {
    expect(validateIdentifier('1234')).toBeTruthy()
    expect(validateIdentifier('12345')).toBeUndefined()
    expect(validateIdentifier('1'.repeat(20))).toBeUndefined()
    expect(validateIdentifier('1'.repeat(21))).toBeTruthy()
    expect(validateIdentifier('17123456*8')).toBeTruthy()
  })

  it('la placa admite de 5 a 8 letras o dígitos, con o sin guion', () => {
    expect(validatePlate('AB12')).toBeTruthy()
    expect(validatePlate('PBA-1234')).toBeUndefined()
    expect(validatePlate('ABCD12345')).toBeTruthy()
    expect(validatePlate('')).toBeTruthy()
  })
})

describe('formulario completo', () => {
  it('no devuelve errores con datos válidos', () => {
    expect(validateDriverForm(valid, today)).toEqual({})
  })

  it('marca cada campo inválido por separado', () => {
    const errors = validateDriverForm(
      { ...valid, firstName: '', lastName: 'x'.repeat(51), vehicleType: '', phone: '123', city: '', email: 'no', password: 'corta' },
      today,
    )
    expect(Object.keys(errors).sort()).toEqual(['city', 'email', 'firstName', 'lastName', 'password', 'phone', 'vehicleType'])
  })

  it('exige una contraseña de entre 8 y 72 bytes', () => {
    expect(validateDriverForm({ ...valid, password: '1234567' }, today).password).toBeTruthy()
    expect(validateDriverForm({ ...valid, password: 'a'.repeat(73) }, today).password).toBeTruthy()
    expect(validateDriverForm({ ...valid, password: 'a'.repeat(72) }, today).password).toBeUndefined()
  })
})
