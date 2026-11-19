import { http } from '../../api/client'
import { isDemoMode } from '../../api/config'
import { ApiError } from '../../api/errors'
import { cancelDemoOrder, createDemoOrder, listDemoOrders, listDemoProducts } from './demo'
import { parseProducts, type Product } from './products'
import { object, string } from '../../api/parse'
import { parseBalancePayment, parseMyBalance, type BalancePayment, type MyBalance } from './balance'
import { parseNotifications, type CustomerNotification } from './notifications'
import { parseMyOrders, parseOrder, type CustomerOrder, type NewCustomerOrder } from './types'

/**
 * Customer order endpoints.
 *
 * The API Gateway serves GET /api/v1/orders/mine, POST /api/v1/orders and POST /api/v1/orders/{id}/cancel
 * (CUSTOMER role). EXPO_PUBLIC_MOCK_CUSTOMER_ORDERS=true still swaps in an in-memory demo.
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

/**
 * What the customer owes (ADR 0006). An account blocked for the balance can ALSO read it: that is how it
 * learns how much to pay.
 */
export function getMyBalance(signal?: AbortSignal): Promise<MyBalance> {
  return http.get('/api/v1/customers/me/balance', parseMyBalance, signal ? { signal } : {})
}

/**
 * Pays the whole balance with the simulated card. No body: the server sets the amount and the client cannot
 * choose it. A declined simulated card answers 200 with `SIMULATED_DECLINED`; nothing owed is 422; a balance
 * that changed while paying is 409 (the charge is refunded).
 */
export function payMyBalance(): Promise<BalancePayment> {
  return http.post('/api/v1/customers/me/balance/payment', parseBalancePayment)
}

/**
 * The customer's notices: the review of their orders, the surcharge and the balance block. Demo mode has none.
 * An account blocked for the balance can also read them: that is how it learns why.
 */
export function listMyNotifications(signal?: AbortSignal): Promise<CustomerNotification[]> {
  if (isDemoMode()) return Promise.resolve([])
  return http.get('/api/v1/notifications/mine', parseNotifications, signal ? { signal } : {})
}

/**
 * Opens the customer's dispute over one of their surcharges (ADR 0007, section 6). Only the reason is sent: the customer
 * comes from the token. 422 out of time or already paid, 409 already disputed, 404 not theirs.
 */
export function openDispute(surchargeId: string, reason: string): Promise<{ id: string }> {
  return http.post(`/api/v1/surcharges/${encodeURIComponent(surchargeId)}/dispute`, (data) => ({ id: string(object(data, 'dispute'), 'id') }), { body: { reason } })
}
