import { describe, expect, it } from 'vitest'
import { toMapRoutes } from './mapRoutes'

const coords = new Map([
  ['a', { latitude: -0.1, longitude: -78.1 }],
  ['b', { latitude: -0.2, longitude: -78.2 }],
  ['c', { latitude: -0.3, longitude: -78.3 }],
])

describe('toMapRoutes', () => {
  it('ordena las paradas por secuencia, omite las que no tienen coordenadas y marca las cerradas', () => {
    const [route] = toMapRoutes(
      [
        {
          id: 'r1',
          driverName: 'Ana',
          stops: [
            { orderId: 'b', sequence: 2, status: 'DELIVERED' },
            { orderId: 'zzz', sequence: 3 },
            { orderId: 'a', sequence: 1, status: 'IN_TRANSIT' },
            { orderId: 'c', sequence: 4, status: 'NOT_DELIVERED' },
          ],
        },
      ],
      coords,
    )

    expect(route?.stops.map((s) => [s.orderId, s.done])).toEqual([['a', false], ['b', true], ['c', true]])
  })

  it('no dibuja rutas sin ninguna parada localizable y nombra a las que no tienen repartidor', () => {
    const routes = toMapRoutes(
      [
        { id: 'sin-coords', driverName: 'Ana', stops: [{ orderId: 'zzz', sequence: 1 }] },
        { id: 'sin-repartidor', driverName: '', stops: [{ orderId: 'a', sequence: 1 }] },
      ],
      coords,
    )

    expect(routes.map((r) => r.id)).toEqual(['sin-repartidor'])
    expect(routes[0]?.driverName).toBe('Sin repartidor')
  })

  it('da un color distinto a cada ruta', () => {
    const routes = toMapRoutes(
      [
        { id: 'r1', driverName: 'Ana', stops: [{ orderId: 'a', sequence: 1 }] },
        { id: 'r2', driverName: 'Beto', stops: [{ orderId: 'b', sequence: 1 }] },
      ],
      coords,
    )

    expect(new Set(routes.map((r) => r.color)).size).toBe(2)
  })
})
