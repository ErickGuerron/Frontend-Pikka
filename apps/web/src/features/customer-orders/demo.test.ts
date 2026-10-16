import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/errors'
import { cancelDemoOrder, createDemoOrder, listDemoOrders, resetDemoOrders } from './demo'
import { orderStatuses } from './types'

const input = {
  address: 'Av. Amazonas 100',
  items: [{ productId: '44444444-4444-4444-4444-444444444444', quantity: 1 }],
  latitude: -0.18,
  longitude: -78.47,
  deliveryDate: '2099-01-01',
  windowStart: '09:00',
  windowEnd: '12:00',
}

beforeEach(() => {
  resetDemoOrders()
})

describe('demo adapter de pedidos del cliente', () => {
  it('trae pedidos de muestra en los estados principales', async () => {
    const statuses = (await listDemoOrders()).map((o) => o.status)
    for (const status of ['PENDING', 'ROUTE_ASSIGNED', 'IN_TRANSIT', 'PENDING_REVIEW', 'DELIVERED', 'CANCELLED'] as const) {
      expect(statuses).toContain(status)
    }
    expect(statuses.every((s) => orderStatuses.includes(s))).toBe(true)
  })

  it('crea el pedido como PENDING y lo agrega a la lista', async () => {
    const created = await createDemoOrder(input)
    expect(created.status).toBe('PENDING')
    expect(created.reviewReasons).toEqual([])
    expect((await listDemoOrders()).some((o) => o.id === created.id)).toBe(true)
  })

  it('deja en revisión un pedido fuera de la zona cubierta', async () => {
    const created = await createDemoOrder({ ...input, latitude: 40.4, longitude: -3.7 })
    expect(created.status).toBe('PENDING_REVIEW')
    expect(created.reviewReasons).toEqual(['ZONE_NOT_COVERED'])
  })

  it('cancela solo en PENDING o ROUTE_ASSIGNED', async () => {
    const orders = await listDemoOrders()
    for (const order of orders) {
      const allowed = order.status === 'PENDING' || order.status === 'ROUTE_ASSIGNED'
      if (allowed) {
        expect((await cancelDemoOrder(order.id)).status).toBe('CANCELLED')
      } else {
        await expect(cancelDemoOrder(order.id)).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })
      }
    }
  })

  it('devuelve 404 si el pedido no existe', async () => {
    const error: unknown = await cancelDemoOrder('nope').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404 })
  })
})
