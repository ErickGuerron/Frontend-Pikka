import { http } from '@/shared/api/client'
import { ApiError } from '@/shared/api/errors'
import { parseOrder } from '@/features/orders/types'
import { cancelDemoOrder, createDemoOrder, listDemoOrders } from './demo'
import { parseMyOrders, type CustomerOrder, type NewCustomerOrder } from './types'
import { parseNotifications, type CustomerNotification } from './notifications'

/**
 * Customer order endpoints.
 *
 * Served by the API Gateway: GET /api/v1/orders/mine and POST /api/v1/orders (CUSTOMER role).
 * NOT IMPLEMENTED: POST /api/v1/orders/{id}/cancel (Sprint 3 in the orders plan).
 * VITE_MOCK_CUSTOMER_ORDERS=true swaps in an in-memory demo for offline work.
 */

/** True when the in-memory demo adapter replaces the network (default: off). */
export function isDemoMode(): boolean {
  return import.meta.env.VITE_MOCK_CUSTOMER_ORDERS === 'true'
}

/** The endpoint is missing or unreachable: show "service not available", not a crash. */
export function isServiceUnavailable(error: unknown): boolean {
  return error instanceof ApiError && [0, 404, 501, 502, 503, 504].includes(error.status)
}

export function listMyOrders(signal?: AbortSignal): Promise<CustomerOrder[]> {
  if (isDemoMode()) return listDemoOrders()
  return http.get('/api/v1/orders/mine', parseMyOrders, { signal })
}

/** `notes` is intentionally not sent: the OpenAPI CreateOrderRequest has no such field. */
export function createOrder(input: NewCustomerOrder): Promise<CustomerOrder> {
  if (isDemoMode()) return createDemoOrder(input)
  const { address, latitude, longitude, deliveryDate, windowStart, windowEnd } = input
  return http.post('/api/v1/orders', parseOrder, { body: { address, latitude, longitude, deliveryDate, windowStart, windowEnd } })
}

/** Avisos sobre la revisión de los pedidos del cliente. En demo no hay avisos reales. */
export function listMyNotifications(signal?: AbortSignal): Promise<CustomerNotification[]> {
  if (isDemoMode()) return Promise.resolve([])
  return http.get('/api/v1/notifications/mine', parseNotifications, { signal })
}

export function cancelOrder(id: string): Promise<CustomerOrder> {
  if (isDemoMode()) return cancelDemoOrder(id)
  return http.post(`/api/v1/orders/${encodeURIComponent(id)}/cancel`, parseOrder)
}
