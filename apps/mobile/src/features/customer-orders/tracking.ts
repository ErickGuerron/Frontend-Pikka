import { API_BASE_URL } from '../../api/config'
import {
  parseTrackingSnapshot as parseSharedSnapshot,
  type TrackingSnapshot as SharedTrackingSnapshot,
} from '../../../../shared/customer-orders/tracking'
import { orderStatuses, type OrderStatus } from './types'

/** Subprotocol the Gateway expects; the JWT travels as the second entry of Sec-WebSocket-Protocol. */
export const TRACKING_SUBPROTOCOL = 'pikka.v1'

export type TrackingSnapshot = SharedTrackingSnapshot<OrderStatus>

export function parseTrackingSnapshot(data: unknown): TrackingSnapshot {
  return parseSharedSnapshot(data, orderStatuses)
}

/** WebSocket URL for one order. The Gateway origin is reused, with http(s) mapped to ws(s). */
export function trackingSocketUrl(orderId: string): string {
  const base = API_BASE_URL.replace(/^http/, 'ws')
  return `${base}/api/v1/orders/${encodeURIComponent(orderId)}/tracking/ws`
}
