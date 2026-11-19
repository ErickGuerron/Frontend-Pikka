import { describe, expect, it } from 'vitest'
import { validateNewOrder } from './validation'

const today = '2026-10-10'
const valid = {
  address: 'Av. Central 123',
  location: { latitude: -0.2, longitude: -78.5 },
  deliveryDate: '2026-10-11',
  windowStart: '09:00',
  windowEnd: '11:00',
}

describe('validateNewOrder: formato de la fecha de entrega', () => {
  it('rechaza una fecha que no existe en el calendario, aunque tenga el formato correcto', () => {
    expect(validateNewOrder({ ...valid, deliveryDate: '2026-02-31' }, today).deliveryDate).toMatch(/AAAA-MM-DD/)
  })
})
