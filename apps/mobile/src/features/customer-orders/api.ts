import { http } from '../../api/client'
import { isDemoMode } from '../../api/config'
import { ApiError } from '../../api/errors'
import { cancelDemoOrder, createDemoOrder, listDemoOrders, listDemoProducts } from './demo'
import { parseProducts, type Product } from './products'
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

/** Any authenticated role can read the catalog; a CUSTOMER only gets active products, so no filter is sent. */
export async function listProducts(signal?: AbortSignal): Promise<Product[]> {
  const products = isDemoMode() ? listDemoProducts() : await http.get('/api/v1/products', parseProducts, signal ? { signal } : {})
  return products.filter((product) => product.active)
}

/**
 * `notes` is intentionally not sent: the OpenAPI CreateOrderRequest has no such field.
 * `postalCode` is omitted when empty; the phone is sent already normalized. The map point travels as
 * `latitude`/`longitude` (real coordinates) and is omitted when the customer did not pick one.
 */
export function createOrder(input: NewCustomerOrder): Promise<CustomerOrder> {
  if (isDemoMode()) return createDemoOrder(input)
  const { address, addressReference, postalCode, contactPhone, deliveryDate, windowStart, windowEnd, items, location } = input
  const body = {
    address,
    addressReference,
    ...(postalCode === undefined || postalCode === '' ? {} : { postalCode }),
    ...(location === undefined ? {} : { latitude: location.latitude, longitude: location.longitude }),
    contactPhone,
    deliveryDate,
    windowStart,
    windowEnd,
    items,
  }
  return http.post('/api/v1/orders', parseOrder, { body })
}

export function cancelOrder(id: string): Promise<CustomerOrder> {
  if (isDemoMode()) return cancelDemoOrder(id)
  return http.post(`/api/v1/orders/${encodeURIComponent(id)}/cancel`, parseOrder)
}
