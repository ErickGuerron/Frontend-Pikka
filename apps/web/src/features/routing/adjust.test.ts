import { describe, expect, it } from 'vitest'
import { insertUnassignedOrder, moveStop } from './adjust'
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
  ],
  unassignedOrderIds: ['o-9'],
}

describe('pedido de último momento', () => {
  it('lo agrega al final de la ruta elegida y lo quita de los sin repartidor', () => {
    const next = insertUnassignedOrder(plan, 'o-9', 'r-2', 'Z')

    expect(next.routes[1]?.stops.map((s) => [s.orderId, s.sequence])).toEqual([['o-3', 1], ['o-9', 2]])
    expect(next.unassignedOrderIds).toEqual([])
  })

  it('no inserta un pedido que ya tiene repartidor ni una ruta que no existe', () => {
    expect(() => insertUnassignedOrder(plan, 'o-1', 'r-2', 'A')).toThrow(RangeError)
    expect(() => insertUnassignedOrder(plan, 'o-9', 'r-x', 'Z')).toThrow(RangeError)
  })
})

describe('ajuste manual de paradas', () => {
  it('mueve una parada a otra ruta y renumera las dos', () => {
    const next = moveStop(plan, 'o-1', 'r-2')

    expect(next.routes[0]?.stops.map((s) => [s.orderId, s.sequence])).toEqual([['o-2', 1]])
    expect(next.routes[1]?.stops.map((s) => [s.orderId, s.sequence])).toEqual([['o-3', 1], ['o-1', 2]])
  })

  it('no cambia nada si la parada ya está en esa ruta', () => {
    expect(moveStop(plan, 'o-1', 'r-1')).toBe(plan)
  })

  it('no mueve un pedido que no está en el plan', () => {
    expect(() => moveStop(plan, 'o-404', 'r-2')).toThrow(RangeError)
  })

  it('no modifica el plan original', () => {
    moveStop(plan, 'o-1', 'r-2')

    expect(plan.routes[0]?.stops).toHaveLength(2)
  })
})
