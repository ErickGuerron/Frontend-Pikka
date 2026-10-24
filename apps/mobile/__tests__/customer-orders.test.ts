import { ApiError } from '../src/api/errors'
import { cancelDemoOrder, createDemoOrder, listDemoOrders, resetDemoOrders } from '../src/features/customer-orders/demo'
import { pollInterval } from '../src/features/customer-orders/orders-store'
import {
  canCancel,
  filterOrders,
  parseMyOrders,
  pendingDriverNotice,
  pickCurrentOrder,
  progressIndex,
  validateNewOrder,
} from '../src/features/customer-orders/types'

const contact = {
  location: { latitude: -0.2, longitude: -78.5 },
  addressReference: 'Casa azul',
  contactPhone: '0991234567',
  items: [{ productId: 'p-agua-20l', quantity: 2 }],
}

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
    const ok = { ...contact, address: 'Av. Amazonas 123', deliveryDate: '2026-10-12', windowStart: '09:00', windowEnd: '12:00' }
    expect(validateNewOrder(ok, '2026-10-11')).toEqual({})
    expect(validateNewOrder({ ...ok, location: undefined }, '2026-10-11').location).toMatch(/mapa/)
    expect(validateNewOrder({ ...ok, addressReference: 'ab' }, '2026-10-11').addressReference).toBeDefined()
    expect(validateNewOrder({ ...ok, postalCode: '12' }, '2026-10-11').postalCode).toBeDefined()
    expect(validateNewOrder({ ...ok, postalCode: '' }, '2026-10-11').postalCode).toBeUndefined()
    expect(validateNewOrder({ ...ok, contactPhone: '12345' }, '2026-10-11').contactPhone).toBeDefined()
    expect(validateNewOrder({ ...ok, items: [] }, '2026-10-11').items).toMatch(/al menos un producto/)
    expect(validateNewOrder({ ...ok, items: [{ productId: 'p1', quantity: 51 }] }, '2026-10-11').items).toBeDefined()
    expect(validateNewOrder({ ...ok, items: [{ productId: 'p1', quantity: 0 }] }, '2026-10-11').items).toBeDefined()
    expect(validateNewOrder({ ...ok, items: [{ productId: 'p1', quantity: 1 }, { productId: 'p1', quantity: 2 }] }, '2026-10-11').items).toBeDefined()
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
  const input = { ...contact, deliveryDate: '2026-10-12', windowStart: '09:00', windowEnd: '12:00' }

  it('rejects an order without items like the backend does', async () => {
    await expect(createDemoOrder({ ...input, address: 'Calle 1, Quito', items: [] })).rejects.toMatchObject({ status: 400 })
  })

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

describe('pendingDriverNotice', () => {
  it('avisa al cliente que espera repartidor en su zona cuando el pedido esta PENDING', () => {
    const notice = pendingDriverNotice('PENDING')
    expect(notice).toContain('repartidor')
    expect(notice).toContain('zona')
  })

  it('no muestra el aviso en otros estados', () => {
    expect(pendingDriverNotice('PENDING_REVIEW')).toBeNull()
    expect(pendingDriverNotice('ROUTE_ASSIGNED')).toBeNull()
    expect(pendingDriverNotice('DELIVERED')).toBeNull()
  })
})