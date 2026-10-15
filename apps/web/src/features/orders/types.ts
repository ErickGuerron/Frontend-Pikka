import { enumArray, number, object, oneOf, ParseError, string } from '@/shared/api/parse'

/** Estados logísticos de un pedido (contracts/openapi/openapi.yaml, OrderStatus). */
export const orderStatuses = [
  'PENDING',
  'PENDING_REVIEW',
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
  PENDING_REVIEW: 'En revisión',
  ROUTE_ASSIGNED: 'Ruta asignada',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  NOT_DELIVERED: 'No entregado',
  CANCELLED: 'Cancelado',
}

/** Reglas de la validación automática que pueden dejar un pedido en revisión (ADR 0007). */
export const reviewReasonValues = ['ZONE_NOT_COVERED', 'INVALID_WINDOW', 'CAPACITY_EXCEEDED', 'CUSTOMER_BLOCKED', 'ADDRESS_NOT_LOCATED'] as const
export type ReviewReason = (typeof reviewReasonValues)[number]

export const reviewReasonLabels: Record<ReviewReason, string> = {
  ZONE_NOT_COVERED: 'Fuera de una zona atendida',
  INVALID_WINDOW: 'Ventana de entrega no válida',
  CAPACITY_EXCEEDED: 'Capacidad del día superada',
  CUSTOMER_BLOCKED: 'Cliente bloqueado',
  ADDRESS_NOT_LOCATED: 'Dirección no localizada en el mapa',
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
  /** Vacío si el pedido no está en revisión. */
  reviewReasons: ReviewReason[]
  /** RFC 3339, UTC. */
  createdAt: string
}

/** Payload de creación: exactamente lo que acepta CreateOrderRequest. */
export interface NewOrder {
  address: string
  /** Opcional: punto del mapa. Si falta, el backend geocodifica la dirección. */
  latitude?: number
  longitude?: number
  deliveryDate: string
  windowStart: string
  windowEnd: string
}

export const reviewActionValues = ['CONFIRM', 'CORRECT', 'REJECT'] as const
export type ReviewAction = (typeof reviewActionValues)[number]

/** Decisión del operador sobre un pedido en revisión (OrderReviewRequest). */
export interface OrderReviewInput {
  action: ReviewAction
  reason: string
  /** Solo para CORRECT: los campos que el operador ajusta. */
  correction?: {
    address: string
    deliveryDate: string
    windowStart: string
    windowEnd: string
  }
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
    reviewReasons: enumArray(o, 'reviewReasons', reviewReasonValues),
    createdAt: string(o, 'createdAt'),
  }
}

export function parseOrders(data: unknown): Order[] {
  if (!Array.isArray(data)) throw new ParseError('orders: expected array')
  return data.map((item) => parseOrder(item))
}
