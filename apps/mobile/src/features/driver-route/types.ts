import { enumValue, number, object, oneOf, ParseError, string } from '../../api/parse'

/**
 * Progress of one stop. PENDING -> PICKED_UP -> IN_TRANSIT -> DELIVERED | NOT_DELIVERED.
 * The last two are final; the driver never moves a stop backwards.
 */
export const stopStatuses = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'NOT_DELIVERED'] as const
export type StopStatus = (typeof stopStatuses)[number]

/** Statuses the driver can set by advancing a stop (no result yet). */
export type ProgressStatus = Extract<StopStatus, 'PICKED_UP' | 'IN_TRANSIT'>

const nextProgress: Partial<Record<StopStatus, ProgressStatus>> = {
  PENDING: 'PICKED_UP',
  PICKED_UP: 'IN_TRANSIT',
}

/** The only status a stop may advance to next, or null when the stop has a result or no step left. */
export function nextProgressStatus(stop: RouteStop): ProgressStatus | null {
  return nextProgress[stop.status] ?? null
}

export function isFinal(status: StopStatus): boolean {
  return status === 'DELIVERED' || status === 'NOT_DELIVERED'
}

/** Count of stops with a final result, for the progress line of the route. */
export function completedCount(stops: readonly RouteStop[]): number {
  return stops.filter((s) => isFinal(s.status)).length
}

/** Closed list from ADR 0007: the driver cannot type a free-text reason. */
export const notDeliveredReasons = [
  'CLIENT_REFUSED',
  'CLIENT_ABSENT',
  'OUT_OF_WINDOW',
  'PRODUCT_DAMAGED',
  'WRONG_ADDRESS',
  'DUPLICATE_ORDER',
] as const
export type NotDeliveredReason = (typeof notDeliveredReasons)[number]

export const reasonLabels: Record<NotDeliveredReason, string> = {
  CLIENT_REFUSED: 'El cliente no quiso recibirlo',
  CLIENT_ABSENT: 'El cliente no estaba',
  OUT_OF_WINDOW: 'Fuera de la ventana horaria',
  PRODUCT_DAMAGED: 'Producto dañado',
  WRONG_ADDRESS: 'Dirección errónea',
  DUPLICATE_ORDER: 'Pedido duplicado',
}

export interface RouteStop {
  id: string
  /** Order of the stop in the route, starting at 1. */
  sequence: number
  address: string
  /** HH:mm */
  windowStart: string
  windowEnd: string
  status: StopStatus
  reason: NotDeliveredReason | null
}

export interface DriverRoute {
  id: string
  stops: RouteStop[]
}

export type StopOutcome = Extract<StopStatus, 'DELIVERED' | 'NOT_DELIVERED'>

export interface StopResultInput {
  outcome: StopOutcome
  reason?: NotDeliveredReason
}

export function parseRouteStop(data: unknown): RouteStop {
  const o = object(data, 'stop')
  const rawReason = o.reason
  return {
    id: string(o, 'id'),
    sequence: number(o, 'sequence'),
    address: string(o, 'address'),
    windowStart: string(o, 'windowStart'),
    windowEnd: string(o, 'windowEnd'),
    status: oneOf(o, 'status', stopStatuses),
    reason: rawReason === null || rawReason === undefined ? null : enumValue(rawReason, notDeliveredReasons, 'reason'),
  }
}

export function parseDriverRoute(data: unknown): DriverRoute {
  const o = object(data, 'route')
  if (!Array.isArray(o.stops)) throw new ParseError('stops: expected array')
  return { id: string(o, 'id'), stops: o.stops.map(parseRouteStop) }
}

/** Stops in the order the driver must visit them. */
export function orderedStops(stops: readonly RouteStop[]): RouteStop[] {
  return [...stops].sort((a, b) => a.sequence - b.sequence)
}

/** Any stop without a final result accepts one; a registered stop is final. */
export function canRegisterResult(stop: RouteStop): boolean {
  return !isFinal(stop.status)
}

/** Returns the reason the input is invalid, or null when it can be sent. */
export function validateStopResult(input: StopResultInput): string | null {
  if (input.outcome === 'NOT_DELIVERED' && input.reason === undefined) {
    return 'Elige el motivo por el que no se entregó.'
  }
  if (input.outcome === 'DELIVERED' && input.reason !== undefined) {
    return 'Una entrega exitosa no lleva motivo.'
  }
  return null
}

export function remainingCount(stops: readonly RouteStop[]): number {
  return stops.length - completedCount(stops)
}
