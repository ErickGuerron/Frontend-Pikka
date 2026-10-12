import { ApiError } from '../src/api/errors'
import { cancelDemoOrder, createDemoOrder, listDemoOrders, resetDemoOrders } from '../src/features/customer-orders/demo'
import { pollInterval } from '../src/features/customer-orders/orders-store'
import {
  canCancel,
  filterOrders,
  parseMyOrders,
  pickCurrentOrder,
  progressIndex,
  validateNewOrder,
} from '../src/features/customer-orders/types'

beforeEach(() => {
  resetDemoOrders()
})

describe('order rules', () => {
  it('allows cancelling only PENDING and ROUTE_ASSIGNED', () => {
    expect(canCancel('PENDING')).toBe(true)
    expect(canCancel('ROUTE_ASSIGNED')).toBe(true)
    for (const s of ['PENDING_REVIEW', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'NOT_DELIVERED', 'CANCELLED'] as const) {
      expect(canCancel(s)).toBe(false)
    }
  })

  it('maps statuses to stepper positions', () => {
    expect(progressIndex('PENDING')).toBe(0)
    expect(progressIndex('IN_TRANSIT')).toBe(2)
    expect(progressIndex('DELIVERED')).toBe(3)
    expect(progressIndex('CANCELLED')).toBe(-1)
  })

  it('validates a new order', () => {
    const ok = { address: 'Av. Amazonas 123', deliveryDate: '2026-10-12', windowStart: '09:00', windowEnd: '12:00' }
    expect(validateNewOrder(ok, '2026-10-11')).toEqual({})
    expect(validateNewOrder({ ...ok, address: 'abc' }, '2026-10-11').address).toBeDefined()
    expect(validateNewOrder({ ...ok, deliveryDate: '2026-10-10' }, '2026-10-11').deliveryDate).toMatch(/anterior a hoy/)
    expect(validateNewOrder({ ...ok, deliveryDate: '2026-02-31' }, '2026-10-11').deliveryDate).toBeDefined()
    expect(validateNewOrder({ ...ok, windowStart: '10:00' }, '2026-10-11').window).toBeDefined()
  })

  it('polls only while an order is in active transit', async () => {
    const orders = await listDemoOrders()
    expect(pollInterval(orders)).toBe(10_000)
    expect(pollInterval(orders.filter((o) => o.status === 'DELIVERED' || o.status === 'PENDING'))).toBe(false)
  })

  it('picks the order on the way as current and filters by text and status', async () => {
    const orders = await listDemoOrders()
    expect(pickCurrentOrder(orders)?.status).toBe('IN_TRANSIT')
    expect(filterOrders(orders, 'papallacta', 'ALL')).toHaveLength(1)
    expect(filterOrders(orders, '', 'CANCELLED')).toHaveLength(1)
  })

  it('parses the gateway envelope and rejects garbage', () => {
    const raw = { id: 'x', address: 'a', deliveryDate: '2026-01-01', windowStart: '09:00', windowEnd: '12:00', status: 'PENDING', reviewReasons: [], createdAt: 'now' }
    expect(parseMyOrders({ orders: [raw] })).toHaveLength(1)
    expect(() => parseMyOrders({ nope: 1 })).toThrow()
    expect(() => parseMyOrders([{ ...raw, status: 'WAT' }])).toThrow()
  })
})

describe('demo adapter', () => {
  const input = { deliveryDate: '2026-10-12', windowStart: '09:00', windowEnd: '12:00' }

  it('creates PENDING for covered and PENDING_REVIEW for uncovered addresses', async () => {
    const covered = await createDemoOrder({ ...input, address: 'Calle 1, Quito' })
    const uncovered = await createDemoOrder({ ...input, address: 'Pifo km 12' })
    expect(covered.status).toBe('PENDING')
    expect(uncovered.status).toBe('PENDING_REVIEW')
    expect(new Set([covered.id, uncovered.id]).size).toBe(2)
  })

  it('cancels PENDING orders and rejects other statuses with 409', async () => {
    const pending = (await listDemoOrders()).find((o) => o.status === 'PENDING')
    expect((await cancelDemoOrder(pending?.id ?? '')).status).toBe('CANCELLED')
    const delivered = (await listDemoOrders()).find((o) => o.status === 'DELIVERED')
    await expect(cancelDemoOrder(delivered?.id ?? '')).rejects.toMatchObject({ status: 409 })
    await expect(cancelDemoOrder('missing')).rejects.toBeInstanceOf(ApiError)
  })
})
