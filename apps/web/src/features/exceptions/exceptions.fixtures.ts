import type { Order } from '@/features/orders/types'
import { adminUser, mockApi } from '@/test/utils'

/** Pedido en revisión de referencia; cada prueba cambia solo los motivos que necesita. */
export function buildException(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o-9',
    address: 'Av. Central 123, Col. Centro',
    latitude: -0.2,
    longitude: -78.5,
    deliveryDate: '2099-12-31',
    windowStart: '09:00',
    windowEnd: '11:00',
    status: 'PENDING_REVIEW',
    reviewReasons: ['ZONE_NOT_COVERED', 'INVALID_WINDOW'],
    createdAt: '2026-10-10T12:00:00Z',
    ...overrides,
  }
}

/**
 * Simula el gateway: la cola devuelve `queue`, y una decisión la vacía (el pedido
 * sale de la cola). Registra las decisiones enviadas para comprobarlas.
 */
export function mockQueue(queue: Order[]) {
  return mockApi((url, init) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
    if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
    if (url.endsWith('/api/v1/orders/exceptions')) return { status: 200, body: queue }
    if (url.endsWith('/review') && init.method === 'POST') {
      queue.splice(0, queue.length)
      return { status: 200, body: { ...buildException(), status: 'PENDING' } }
    }
    return { status: 200, body: [] }
  })
}
