import { describe, expect, it } from 'vitest'
import { localToday, validateNewOrder } from './validation'

const today = '2026-10-10'
const valid = {
  address: 'Av. Central 123',
  location: { latitude: -0.2, longitude: -78.5 },
  deliveryDate: '2026-10-11',
  windowStart: '09:00',
  windowEnd: '11:00',
}

describe('validateNewOrder', () => {
  it('acepta un pedido completo y vigente', () => {
    expect(validateNewOrder(valid, today)).toEqual({})
  })

  it('exige una dirección de al menos 5 caracteres, ignorando espacios', () => {
    expect(validateNewOrder({ ...valid, address: '  abc  ' }, today).address).toBeDefined()
  })

  it('no exige el punto del mapa: sin él, el backend geocodifica la dirección', () => {
    expect(validateNewOrder({ ...valid, location: null }, today)).toEqual({})
  })

  it('rechaza coordenadas fuera del rango WGS 84', () => {
    expect(validateNewOrder({ ...valid, location: { latitude: 91, longitude: 0 } }, today).location).toMatch(/no es válida/)
    expect(validateNewOrder({ ...valid, location: { latitude: 0, longitude: -181 } }, today).location).toMatch(/no es válida/)
    expect(validateNewOrder({ ...valid, location: { latitude: Number.NaN, longitude: 0 } }, today).location).toMatch(/no es válida/)
  })

  it('acepta los límites exactos de latitud y longitud', () => {
    expect(validateNewOrder({ ...valid, location: { latitude: -90, longitude: 180 } }, today)).toEqual({})
  })

  it('rechaza fechas anteriores a hoy y acepta hoy', () => {
    expect(validateNewOrder({ ...valid, deliveryDate: '2026-10-09' }, today).deliveryDate).toMatch(/anterior a hoy/)
    expect(validateNewOrder({ ...valid, deliveryDate: today }, today).deliveryDate).toBeUndefined()
  })

  it('exige que la hora de fin sea posterior a la de inicio', () => {
    expect(validateNewOrder({ ...valid, windowStart: '11:00', windowEnd: '09:00' }, today).windowEnd).toMatch(/posterior/)
    expect(validateNewOrder({ ...valid, windowStart: '11:00', windowEnd: '11:00' }, today).windowEnd).toMatch(/posterior/)
  })

  it('rechaza horas con formato inválido', () => {
    expect(validateNewOrder({ ...valid, windowStart: '25:00' }, today).windowStart).toBeDefined()
    expect(validateNewOrder({ ...valid, windowEnd: '' }, today).windowEnd).toBeDefined()
  })
})

describe('localToday', () => {
  it('formatea la fecha local como YYYY-MM-DD con ceros a la izquierda', () => {
    expect(localToday(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})
