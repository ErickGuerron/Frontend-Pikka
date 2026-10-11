import { http } from '@/shared/api/client'
import { type NewOrder, type Order, parseOrder, parseOrders } from './types'

/** Lista los pedidos. Ruta publicada en contracts/openapi/openapi.yaml (Backend-Pikka). */
export function getOrders(): Promise<Order[]> {
  return http.get('/api/v1/orders', parseOrders)
}

/** Registra un pedido. Ruta publicada en contracts/openapi/openapi.yaml (Backend-Pikka). */
export function createOrder(input: NewOrder): Promise<Order> {
  return http.post('/api/v1/orders', parseOrder, { body: input })
}
