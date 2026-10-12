import { http } from '../../api/client'
import { isDemoMode } from '../../api/config'
import { ApiError } from '../../api/errors'
import { cancelDemoOrder, createDemoOrder, listDemoOrders } from './demo'
import { parseMyOrders, parseOrder, type CustomerOrder, type NewCustomerOrder } from './types'

/**
 * Customer order endpoints.
 *
 * PLANNED, NOT IMPLEMENTED: the API Gateway does not serve these routes yet
 * (GET /api/v1/orders/mine, POST /api/v1/orders, POST /api/v1/orders/{id}/cancel).
 * This layer targets the future customer contract; until then EXPO_PUBLIC_MOCK_CUSTOMER_ORDERS=true
 * swaps in an in-memory demo.
 */

/** The endpoint is missing or unreachable: show "service not available", not a crash. */
export function isServiceUnavailable(error: unknown): boolean {
  return error instanceof ApiError && [0, 404, 501, 502, 503, 504].includes(error.status)
}

export function listMyOrders(signal?: AbortSignal): Promise<CustomerOrder[]> {
  if (isDemoMode()) return listDemoOrders()
  return http.get('/api/v1/orders/mine', parseMyOrders, signal ? { signal } : {})
}

/** `notes` is intentionally not sent: the OpenAPI CreateOrderRequest has no such field. */
export function createOrder(input: NewCustomerOrder): Promise<CustomerOrder> {
  if (isDemoMode()) return createDemoOrder(input)
  const { address, deliveryDate, windowStart, windowEnd } = input
  return http.post('/api/v1/orders', parseOrder, { body: { address, deliveryDate, windowStart, windowEnd } })
}

export function cancelOrder(id: string): Promise<CustomerOrder> {
  if (isDemoMode()) return cancelDemoOrder(id)
  return http.post(`/api/v1/orders/${encodeURIComponent(id)}/cancel`, parseOrder)
}
