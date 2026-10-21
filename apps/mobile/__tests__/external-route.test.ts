import { externalRouteUrl } from '../src/features/driver-route/external-route'
import type { RouteStop } from '../src/features/driver-route/types'

function stop(id: string, address: string, point?: [number, number]): RouteStop {
  return {
    id,
    sequence: 1,
    address,
    windowStart: '08:00',
    windowEnd: '12:00',
    status: 'IN_TRANSIT',
    reason: null,
    ...(point ? { latitude: point[0], longitude: point[1] } : {}),
  }
}

describe('externalRouteUrl', () => {
  it('sends the stored coordinates, not the address text, so Google pins the same point as the map', () => {
    const url = externalRouteUrl([stop('a', 'Ambato, Ecuador', [-1.2491, -78.6167])])
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=-1.2491%2C-78.6167')
  })

  it('keeps the given order: waypoints first, last stop as destination', () => {
    const url = externalRouteUrl([
      stop('a', 'A', [-1.1, -78.1]),
      stop('b', 'B', [-1.2, -78.2]),
      stop('c', 'C', [-1.3, -78.3]),
    ])
    expect(url).toContain('destination=-1.3%2C-78.3')
    expect(url).toContain('waypoints=-1.1%2C-78.1%7C-1.2%2C-78.2')
  })

  it('falls back to the address for a stop without coordinates', () => {
    const url = externalRouteUrl([stop('a', 'Calle Larga 5')])
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=Calle%20Larga%205')
  })

  it('returns null when there is nothing to navigate to', () => {
    expect(externalRouteUrl([])).toBeNull()
  })
})
