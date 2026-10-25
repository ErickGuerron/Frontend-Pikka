import { describe, expect, it } from 'vitest'
import { validateNewOrder } from './validation'

const today = '2026-10-10'
const valid = {
  address: 'Av. Central 123',
  location: { latitude: -0.2, longitude: -78.5 },
  deliveryDate: today,
  windowStart: '09:00',
  windowEnd: '11:00',
}
const line = { productId: 'p-1', quantity: 1 }

describe('PLAN: order validation boundaries', () => {
  it.each([
    [0, false],
    [1, true],
    [50, true],
    [51, false],
  ])('quantity_%i_isAccepted_%s', (quantity, ok) => {
    const { items } = validateNewOrder({ ...valid, items: [{ ...line, quantity }] }, today)
    expect(items === undefined).toBe(ok)
  })

  it('items_emptyList_isRejectedAndSingleLineIsAccepted', () => {
    expect(validateNewOrder({ ...valid, items: [] }, today).items).toMatch(/al menos un producto/)
    expect(validateNewOrder({ ...valid, items: [line] }, today)).toEqual({})
  })

  // The rule limits units per line (1..50), not the number of lines; characterised as is.
  it('items_51DistinctLinesOfOneUnit_areAccepted_CurrentBehavior', () => {
    const items = Array.from({ length: 51 }, (_, i) => ({ productId: `p-${String(i)}`, quantity: 1 }))
    expect(validateNewOrder({ ...valid, items }, today).items).toBeUndefined()
  })

  it.each([
    ['abcd', false],
    ['abcde', true],
    ['  abcd  ', false],
  ])('address_%j_isAccepted_%s', (address, ok) => {
    expect(validateNewOrder({ ...valid, address, items: [line] }, today).address === undefined).toBe(ok)
  })

  it.each([
    [-90, -180, true],
    [90, 180, true],
    [-90.0001, 0, false],
    [90.0001, 0, false],
    [0, -180.0001, false],
    [0, 180.0001, false],
  ])('location_lat%f_lon%f_isAccepted_%s', (latitude, longitude, ok) => {
    const { location } = validateNewOrder({ ...valid, location: { latitude, longitude }, items: [line] }, today)
    expect(location === undefined).toBe(ok)
    if (!ok) expect(location).toMatch(/no es válida/)
  })

  it('deliveryDate_yesterdayIsRejected_todayAndTomorrowAreAccepted', () => {
    expect(validateNewOrder({ ...valid, deliveryDate: '2026-10-09', items: [line] }, today).deliveryDate).toMatch(/anterior a hoy/)
    expect(validateNewOrder({ ...valid, deliveryDate: today, items: [line] }, today).deliveryDate).toBeUndefined()
    expect(validateNewOrder({ ...valid, deliveryDate: '2026-10-11', items: [line] }, today).deliveryDate).toBeUndefined()
  })
})
