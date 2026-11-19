import { distanceMeters, formatDistance, paginate, sortStops, PAGE_SIZE } from '../src/features/driver-route/stop-sort'
import type { RouteStop } from '../src/features/driver-route/types'

function stop(id: string, over: Partial<RouteStop> = {}): RouteStop {
  return { id, sequence: 1, address: id, windowStart: '09:00', windowEnd: '12:00', status: 'PENDING', reason: null, latitude: -0.18, longitude: -78.48, ...over }
}

const driver = { latitude: -0.18, longitude: -78.48 }

describe('distanceMeters', () => {
  it('is zero for the same point and about 111 km per degree of latitude', () => {
    expect(distanceMeters(driver, driver)).toBe(0)
    expect(distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 })).toBeGreaterThan(110_000)
    expect(distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 })).toBeLessThan(112_000)
  })
})

describe('formatDistance', () => {
  it('uses meters under a kilometer and one decimal of km above', () => {
    expect(formatDistance(340.4)).toBe('340 m')
    expect(formatDistance(1530)).toBe('1.5 km')
  })
})

describe('sortStops', () => {
  const far = stop('far', { latitude: -0.2, longitude: -78.5, windowStart: '08:00', windowEnd: '18:00' })
  const near = stop('near', { latitude: -0.1801, longitude: -78.4801, windowStart: '10:00', windowEnd: '11:00' })
  const mid = stop('mid', { latitude: -0.19, longitude: -78.49, windowStart: '09:00', windowEnd: '14:00' })
  const route = [far, near, mid]

  it('keeps the route order by default', () => {
    expect(sortStops(route, 'route', driver).map((s) => s.id)).toEqual(['far', 'near', 'mid'])
  })

  it('puts the closest to the driver first', () => {
    expect(sortStops(route, 'nearest', driver).map((s) => s.id)).toEqual(['near', 'mid', 'far'])
  })

  it('puts the order whose window opened earliest first (longest waiting)', () => {
    expect(sortStops(route, 'waiting', driver).map((s) => s.id)).toEqual(['far', 'mid', 'near'])
  })

  it('puts the order whose window closes first on top', () => {
    expect(sortStops(route, 'deadline', driver).map((s) => s.id)).toEqual(['near', 'mid', 'far'])
  })

  it('sends orders without coordinates last when sorting by distance, and without a driver keeps route order', () => {
    const noPoint = stop('x', { latitude: undefined, longitude: undefined })
    expect(sortStops([noPoint, far, near], 'nearest', driver).map((s) => s.id)).toEqual(['near', 'far', 'x'])
    expect(sortStops(route, 'nearest', null).map((s) => s.id)).toEqual(['far', 'near', 'mid'])
  })

  it('does not mutate its input', () => {
    const copy = [...route]
    sortStops(route, 'deadline', driver)
    expect(route).toEqual(copy)
  })
})

describe('paginate', () => {
  const items = Array.from({ length: 12 }, (_, i) => i)

  it('uses pages of 5', () => {
    expect(PAGE_SIZE).toBe(5)
    expect(paginate(items, 0)).toEqual({ items: [0, 1, 2, 3, 4], page: 0, pages: 3 })
    expect(paginate(items, 2)).toEqual({ items: [10, 11], page: 2, pages: 3 })
  })

  it('clamps an out-of-range page and reports one page for an empty list', () => {
    expect(paginate(items, 9).page).toBe(2)
    expect(paginate(items, -1).page).toBe(0)
    expect(paginate([], 0)).toEqual({ items: [], page: 0, pages: 1 })
  })
})
