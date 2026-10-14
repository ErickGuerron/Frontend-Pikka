import { enumValue, number, object, oneOf, ParseError, string } from '../../api/parse'

export const stopStatuses = ['PENDING', 'DELIVERED', 'NOT_DELIVERED'] as const
export type StopStatus = (typeof stopStatuses)[number]

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

export type StopOutcome = Exclude<StopStatus, 'PENDING'>

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

/** Only a pending stop accepts a result; a registered stop is final. */
export function canRegisterResult(stop: RouteStop): boolean {
  return stop.status === 'PENDING'
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
  return stops.filter((s) => s.status === 'PENDING').length
}
