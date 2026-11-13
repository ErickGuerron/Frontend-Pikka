import { number, object, oneOf, string } from '../api/parse'

/** Customer view of one order, as the Gateway composes it (GET /orders/:id/tracking and the WebSocket). */
export interface TrackingSnapshot<Status extends string = string> {
  orderId: string
  status: Status
  deliveryAddress: string
  deliveryWindow: { start: string; end: string }
  eta: { distanceMeters: number; durationSeconds: number } | null
  stopsBefore: number | null
  /** Last fresh position of the driver (coordinates only, no identity). Null when there is no recent one. */
  driverPosition: { latitude: number; longitude: number; recordedAt: string } | null
  /** Punto de entrega del pedido del cliente, para el mapa. */
  deliveryPoint: { latitude: number; longitude: number } | null
  /** Road path from the driver to this order's delivery point; empty when the gateway has none. */
  road: { latitude: number; longitude: number }[]
  updatedAt: string
}

function parseDeliveryPoint(raw: unknown): TrackingSnapshot['deliveryPoint'] {
  if (raw === null || raw === undefined) return null
  const point = object(raw, 'delivery_point')
  return { latitude: number(point, 'latitude'), longitude: number(point, 'longitude') }
}

function parseDriverPosition(raw: unknown): TrackingSnapshot['driverPosition'] {
  if (raw === null || raw === undefined) return null
  const pos = object(raw, 'driver_position')
  return { latitude: number(pos, 'latitude'), longitude: number(pos, 'longitude'), recordedAt: string(pos, 'recorded_at') }
}

/** A road that is not a list of [lat, lon] pairs is dropped: the map just shows no line, the snapshot still serves. */
function parseRoad(raw: unknown): TrackingSnapshot['road'] {
  if (!Array.isArray(raw)) return []
  const road: TrackingSnapshot['road'] = []
  for (const pair of raw) {
    if (!Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== 'number' || typeof pair[1] !== 'number') return []
    road.push({ latitude: pair[0], longitude: pair[1] })
  }
  return road
}

function parseEta(raw: unknown): TrackingSnapshot['eta'] {
  if (raw === null || raw === undefined) return null
  const eta = object(raw, 'eta')
  return { distanceMeters: number(eta, 'distance_meters'), durationSeconds: number(eta, 'duration_seconds') }
}

/** Parses the snake_case snapshot. The ETA and the stop count are null when the Gateway cannot compute them. */
export function parseTrackingSnapshot<Status extends string>(data: unknown, statuses: readonly Status[]): TrackingSnapshot<Status> {
  const o = object(data, 'tracking snapshot')
  const window = object(o.delivery_window, 'delivery_window')
  return {
    orderId: string(o, 'order_id'),
    status: oneOf(o, 'status', statuses),
    deliveryAddress: string(o, 'delivery_address'),
    deliveryWindow: { start: string(window, 'start'), end: string(window, 'end') },
    eta: parseEta(o.eta),
    stopsBefore: typeof o.stops_before === 'number' ? o.stops_before : null,
    driverPosition: parseDriverPosition(o.driver_position),
    deliveryPoint: parseDeliveryPoint(o.delivery_point),
    road: parseRoad(o.road),
    updatedAt: string(o, 'updated_at'),
  }
}
