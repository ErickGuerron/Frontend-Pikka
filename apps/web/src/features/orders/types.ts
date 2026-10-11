import { number, object, oneOf, ParseError, string } from '@/shared/api/parse'

/** Estados logísticos de un pedido (contracts/openapi/openapi.yaml, OrderStatus). */
export const orderStatuses = [
  'PENDING',
  'ROUTE_ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'NOT_DELIVERED',
  'CANCELLED',
] as const
export type OrderStatus = (typeof orderStatuses)[number]

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  ROUTE_ASSIGNED: 'Ruta asignada',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  NOT_DELIVERED: 'No entregado',
  CANCELLED: 'Cancelado',
}

export interface Order {
  id: string
  address: string
  /** Coordenadas WGS 84 del punto de entrega. */
  latitude: number
  longitude: number
  /** Fecha de entrega en formato YYYY-MM-DD. */
  deliveryDate: string
  /** Ventana aproximada de entrega en formato HH:mm. */
  windowStart: string
  windowEnd: string
  status: OrderStatus
  /** RFC 3339, UTC. */
  createdAt: string
}

/** Payload de creación: exactamente lo que acepta CreateOrderRequest. */
export interface NewOrder {
  address: string
  latitude: number
  longitude: number
  deliveryDate: string
  windowStart: string
  windowEnd: string
}

export function parseOrder(data: unknown): Order {
  const o = object(data, 'order')
  return {
    id: string(o, 'id'),
    address: string(o, 'address'),
    latitude: number(o, 'latitude'),
    longitude: number(o, 'longitude'),
    deliveryDate: string(o, 'deliveryDate'),
    windowStart: string(o, 'windowStart'),
    windowEnd: string(o, 'windowEnd'),
    status: oneOf(o, 'status', orderStatuses),
    createdAt: string(o, 'createdAt'),
  }
}

export function parseOrders(data: unknown): Order[] {
  if (!Array.isArray(data)) throw new ParseError('orders: expected array')
  return data.map((item) => parseOrder(item))
}
