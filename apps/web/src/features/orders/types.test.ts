import { describe, expect, it } from 'vitest'
import { parseOrder } from './types'

const base = {
  id: '11111111-1111-1111-1111-111111111111',
  address: 'Av. Amazonas 123 y Naciones Unidas',
  deliveryDate: '2026-10-12',
  windowStart: '09:00',
  windowEnd: '11:00',
  createdAt: '2026-10-11T12:00:00Z',
}

describe('parseOrder', () => {
  it('acepta el estado NOT_DELIVERED que define el contrato OpenAPI', () => {
    expect(parseOrder({ ...base, status: 'NOT_DELIVERED' }).status).toBe('NOT_DELIVERED')
  })

  it('rechaza un estado que el contrato no define', () => {
    expect(() => parseOrder({ ...base, status: 'LOST' })).toThrow()
  })
})
