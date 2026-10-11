import { http } from '@/shared/api/client'
import { type NewOrder, type Order, type OrderReviewInput, parseOrder, parseOrders } from './types'

/** Lista los pedidos. Ruta publicada en contracts/openapi/openapi.yaml (Backend-Pikka). */
export function getOrders(): Promise<Order[]> {
  return http.get('/api/v1/orders', parseOrders)
}

/** Registra un pedido. Ruta publicada en contracts/openapi/openapi.yaml (Backend-Pikka). */
export function createOrder(input: NewOrder): Promise<Order> {
  return http.post('/api/v1/orders', parseOrder, { body: input })
}

/** Pedidos cuya validación automática no se cumplió. Ruta del contrato OpenAPI. */
export function getOrderExceptions(): Promise<Order[]> {
  return http.get('/api/v1/orders/exceptions', parseOrders)
}

/** Confirma, corrige o rechaza un pedido en revisión. Ruta del contrato OpenAPI. */
export function reviewOrder(id: string, input: OrderReviewInput): Promise<Order> {
  return http.post(`/api/v1/orders/${encodeURIComponent(id)}/review`, parseOrder, { body: input })
}
