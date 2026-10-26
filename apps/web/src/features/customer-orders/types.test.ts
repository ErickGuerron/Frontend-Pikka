import { describe, expect, it } from 'vitest'
import { pollInterval } from './hooks'
import {
  canCancel,
  filterOrders,
  isActiveTransit,
  orderCode,
  parseMyOrders,
  pickCurrentOrder,
  progressIndex,
  type CustomerOrder,
  type OrderStatus,
} from './types'

const base = {
  address: 'Calle Uno 1',
  latitude: -0.2,
  longitude: -78.5,
  deliveryDate: '2099-01-01',
  windowStart: '09:00',
  windowEnd: '12:00',
  reviewReasons: [],
  createdAt: '2026-10-10T12:00:00Z',
}
const raw = (id: string, status: OrderStatus) => ({ ...base, id, status })
const order = (id: string, status: OrderStatus, extra: Partial<CustomerOrder> = {}): CustomerOrder => ({ ...base, id, status, queuePosition: 0, ...extra })

describe('parseMyOrders', () => {
  it('acepta un arreglo o el sobre { orders }', () => {
    expect(parseMyOrders([raw('a', 'PENDING')])).toHaveLength(1)
    expect(parseMyOrders({ orders: [raw('a', 'PENDING'), raw('b', 'DELIVERED')] })).toHaveLength(2)
  })

  it('rechaza otras formas y estados desconocidos', () => {
    expect(() => parseMyOrders('x')).toThrow()
    expect(() => parseMyOrders({ items: [] })).toThrow()
    expect(() => parseMyOrders([raw('a', 'PENDING'), { ...raw('b', 'PENDING'), status: 'WAT' }])).toThrow()
  })

  it('queuePosition vale 0 cuando el payload no lo trae', () => {
    expect(parseMyOrders([raw('a', 'PENDING')])[0]?.queuePosition).toBe(0)
  })

  it('lee el entero de queuePosition y trata negativos, decimales o texto como 0', () => {
    expect(parseMyOrders([{ ...raw('a', 'PENDING'), queuePosition: 3 }])[0]?.queuePosition).toBe(3)
    expect(parseMyOrders([{ ...raw('a', 'PENDING'), queuePosition: -1 }])[0]?.queuePosition).toBe(0)
    expect(parseMyOrders([{ ...raw('a', 'PENDING'), queuePosition: 1.5 }])[0]?.queuePosition).toBe(0)
    expect(parseMyOrders([{ ...raw('a', 'PENDING'), queuePosition: '2' }])[0]?.queuePosition).toBe(0)
  })
})

describe('reglas de estado', () => {
  it('solo se cancela en PENDING y ROUTE_ASSIGNED', () => {
    const allowed: OrderStatus[] = ['PENDING', 'ROUTE_ASSIGNED']
    for (const s of ['PENDING', 'PENDING_REVIEW', 'ROUTE_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'NOT_DELIVERED', 'CANCELLED'] as const) {
      expect(canCancel(s)).toBe(allowed.includes(s))
    }
  })

  it('mapea el estado al paso del progreso', () => {
    expect(progressIndex('PENDING')).toBe(0)
    expect(progressIndex('ROUTE_ASSIGNED')).toBe(1)
    expect(progressIndex('PICKED_UP')).toBe(2)
    expect(progressIndex('IN_TRANSIT')).toBe(2)
    expect(progressIndex('DELIVERED')).toBe(3)
    expect(progressIndex('PENDING_REVIEW')).toBe(-1)
    expect(progressIndex('CANCELLED')).toBe(-1)
  })

  it('consulta cada 10 s solo con pedidos en tránsito', () => {
    expect(isActiveTransit('IN_TRANSIT')).toBe(true)
    expect(pollInterval([order('a', 'IN_TRANSIT')])).toBe(10_000)
    expect(pollInterval([order('a', 'PENDING'), order('b', 'DELIVERED')])).toBe(false)
    expect(pollInterval(undefined)).toBe(false)
  })

  it('elige primero el pedido en camino', () => {
    const list = [order('p', 'PENDING'), order('t', 'IN_TRANSIT'), order('d', 'DELIVERED')]
    expect(pickCurrentOrder(list)?.id).toBe('t')
    expect(pickCurrentOrder([order('d', 'DELIVERED')])).toBeNull()
  })
})

describe('filterOrders', () => {
  const list = [
    order('11111111-aaaa', 'PENDING', { address: 'Av. Amazonas' }),
    order('22222222-bbbb', 'DELIVERED', { address: 'Calle Norte' }),
  ]

  it('busca por dirección y por código con o sin #', () => {
    expect(filterOrders(list, 'amazonas', 'ALL')).toHaveLength(1)
    expect(filterOrders(list, orderCode('22222222-bbbb'), 'ALL').map((o) => o.status)).toEqual(['DELIVERED'])
    expect(filterOrders(list, '22222222', 'ALL')).toHaveLength(1)
  })

  it('filtra por estado y combina con el texto', () => {
    expect(filterOrders(list, '', 'DELIVERED')).toHaveLength(1)
    expect(filterOrders(list, 'amazonas', 'DELIVERED')).toHaveLength(0)
  })
})
