import { http } from '@/shared/api/client'
import { ApiError } from '@/shared/api/errors'
import { cancelDemoOrder, createDemoOrder, listDemoOrders } from './demo'
import { parseCustomerOrder, parseMyOrders, type CustomerOrder, type NewCustomerOrder } from './types'
import { parseNotifications, type CustomerNotification } from './notifications'
import { parseBalancePayment, parseMyBalance, type BalancePayment, type MyBalance } from './balance'
import { object, string } from '@/shared/api/parse'

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
  const { address, addressReference, postalCode, contactPhone, latitude, longitude, deliveryDate, windowStart, windowEnd, items } = input
  return http.post('/api/v1/orders', parseCustomerOrder, {
    body: { address, addressReference, postalCode, contactPhone, latitude, longitude, deliveryDate, windowStart, windowEnd, items },
  })
}

/** Avisos sobre la revisión de los pedidos del cliente. En demo no hay avisos reales. */
export function listMyNotifications(signal?: AbortSignal): Promise<CustomerNotification[]> {
  if (isDemoMode()) return Promise.resolve([])
  return http.get('/api/v1/notifications/mine', parseNotifications, { signal })
}

export function cancelOrder(id: string): Promise<CustomerOrder> {
  if (isDemoMode()) return cancelDemoOrder(id)
  return http.post(`/api/v1/orders/${encodeURIComponent(id)}/cancel`, parseCustomerOrder)
}

/**
 * Lo que el cliente debe (ADR 0006). Una cuenta bloqueada por saldo TAMBIÉN puede consultarlo: así sabe cuánto
 * pagar. En modo demo no se llama (no hay saldo simulado).
 */
export function getMyBalance(signal?: AbortSignal): Promise<MyBalance> {
  return http.get('/api/v1/customers/me/balance', parseMyBalance, { signal })
}

/**
 * Paga el saldo completo con el cobro simulado. No lleva cuerpo: el monto lo fija el servidor, el cliente no
 * puede elegirlo. Una tarjeta simulada rechazada contesta 200 con `SIMULATED_DECLINED`; sin saldo, 422; si el
 * saldo cambió mientras se pagaba, 409 (el cobro se devuelve).
 */
export function payMyBalance(): Promise<BalancePayment> {
  return http.post('/api/v1/customers/me/balance/payment', parseBalancePayment)
}

/**
 * Abre la disputa del cliente sobre uno de sus recargos (ADR 0007, sección 6). Solo se envía el motivo: el cliente sale del
 * token. 422 fuera de plazo o ya pagado, 409 si ya hay una disputa, 404 si el recargo no es suyo.
 */
export function openDispute(surchargeId: string, reason: string): Promise<{ id: string }> {
  return http.post(`/api/v1/surcharges/${encodeURIComponent(surchargeId)}/dispute`, (data) => ({ id: string(object(data, 'dispute'), 'id') }), { body: { reason } })
}
