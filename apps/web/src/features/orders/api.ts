import { http } from '@/shared/api/client'
import { type NewOrder, type Order, parseOrder, parseOrders } from './types'

/** Lista los pedidos. Endpoint pendiente de integración con el Gateway (orders.v1). */
export function getOrders(): Promise<Order[]> {
  return http.get('/api/v1/orders', parseOrders)
}

/** Registra un pedido. Endpoint pendiente de integración con el Gateway (orders.v1). */
export function createOrder(input: NewOrder): Promise<Order> {
  return http.post('/api/v1/orders', parseOrder, { body: input })
}
