import { API_BASE_URL } from '../../api/config'
import { number, object, oneOf, string } from '../../api/parse'
import { orderStatuses, type OrderStatus } from './types'

/** Subprotocol the Gateway expects; the JWT travels as the second entry of Sec-WebSocket-Protocol. */
export const TRACKING_SUBPROTOCOL = 'pikka.v1'

/** Customer view of one order, as the Gateway composes it (GET /orders/:id/tracking and the WebSocket). */
export interface TrackingSnapshot {
  orderId: string
  status: OrderStatus
  deliveryAddress: string
  deliveryWindow: { start: string; end: string }
  eta: { distanceMeters: number; durationSeconds: number } | null
  stopsBefore: number | null
  updatedAt: string
}

function parseEta(raw: unknown): TrackingSnapshot['eta'] {
  if (raw === null || raw === undefined) return null
  const eta = object(raw, 'eta')
  return { distanceMeters: number(eta, 'distance_meters'), durationSeconds: number(eta, 'duration_seconds') }
}

/** Parses the snake_case snapshot. The ETA and the stop count are null when the Gateway cannot compute them. */
export function parseTrackingSnapshot(data: unknown): TrackingSnapshot {
  const o = object(data, 'tracking snapshot')
  const window = object(o.delivery_window, 'delivery_window')
  return {
    orderId: string(o, 'order_id'),
    status: oneOf(o, 'status', orderStatuses),
    deliveryAddress: string(o, 'delivery_address'),
    deliveryWindow: { start: string(window, 'start'), end: string(window, 'end') },
    eta: parseEta(o.eta),
    stopsBefore: typeof o.stops_before === 'number' ? o.stops_before : null,
    updatedAt: string(o, 'updated_at'),
  }
}

/** WebSocket URL for one order. The Gateway origin is reused, with http(s) mapped to ws(s). */
export function trackingSocketUrl(orderId: string): string {
  const base = API_BASE_URL.replace(/^http/, 'ws')
  return `${base}/api/v1/orders/${encodeURIComponent(orderId)}/tracking/ws`
}
