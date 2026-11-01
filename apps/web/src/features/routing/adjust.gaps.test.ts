import { describe, expect, it } from 'vitest'
import { moveStop, unassignedOrders } from './adjust'
import type { RoutePlan } from './types'

const plan: RoutePlan = {
  id: 'plan-1',
  routes: [
    {
      id: 'r-1',
      driverId: 'd-1',
      driverName: 'Luis',
      stops: [
        { orderId: 'o-1', address: 'A', sequence: 1 },
        { orderId: 'o-2', address: 'B', sequence: 2 },
      ],
    },
    { id: 'r-2', driverId: 'd-2', driverName: 'María', stops: [{ orderId: 'o-3', address: 'C', sequence: 1 }] },
    { id: 'r-3', driverId: 'd-3', driverName: 'Jorge', stops: [{ orderId: 'o-4', address: 'D', sequence: 1 }] },
  ],
  unassignedOrderIds: ['o-9'],
}

describe('ajustes del plan: pedidos sin repartidor', () => {
  it('lista los pedidos del plan que todavía no tienen repartidor', () => {
    expect(unassignedOrders(plan)).toEqual(['o-9'])
  })
})

describe('ajustes del plan: mover una parada', () => {
  it('una ruta que no participa en el movimiento conserva su mismo objeto', () => {
    const moved = moveStop(plan, 'o-1', 'r-2')

    expect(moved.routes.find((route) => route.id === 'r-3')).toBe(plan.routes[2])
    expect(moved.routes.find((route) => route.id === 'r-2')?.stops.map((stop) => [stop.orderId, stop.sequence])).toEqual([
      ['o-3', 1],
      ['o-1', 2],
    ])
  })

  it('no modifica el plan original', () => {
    moveStop(plan, 'o-1', 'r-2')

    expect(plan.routes[0]?.stops.map((stop) => stop.orderId)).toEqual(['o-1', 'o-2'])
  })
})
