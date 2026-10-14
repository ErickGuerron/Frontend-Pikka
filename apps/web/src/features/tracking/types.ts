export const deliveryStatuses = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'NOT_DELIVERED'] as const
export type DeliveryStatus = (typeof deliveryStatuses)[number]

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  PENDING: 'Pendiente',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  NOT_DELIVERED: 'No entregado',
}

export interface TrackedStop {
  orderId: string
  address: string
  sequence: number
  status: DeliveryStatus
}

export interface TrackedRoute {
  id: string
  driverName: string
  stops: TrackedStop[]
}

function record(data: unknown, what: string): Record<string, unknown> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new RangeError(`${what}: se esperaba un objeto`)
  return data as Record<string, unknown>
}

function text(obj: Record<string, unknown>, key: string): string {
  const value = obj[key]
  if (typeof value !== 'string') throw new RangeError(`${key}: se esperaba texto`)
  return value
}

export function parseTrackedRoutes(data: unknown): TrackedRoute[] {
  if (!Array.isArray(data)) throw new RangeError('routes: se esperaba una lista')
  return data.map((item) => {
    const r = record(item, 'route')
    const stops = r.stops
    if (!Array.isArray(stops)) throw new RangeError('stops: se esperaba una lista')
    return {
      id: text(r, 'id'),
      driverName: text(r, 'driverName'),
      stops: stops.map((stop) => {
        const s = record(stop, 'stop')
        const status = text(s, 'status')
        if (!(deliveryStatuses as readonly string[]).includes(status)) throw new RangeError(`status: valor desconocido ${status}`)
        if (typeof s.sequence !== 'number') throw new RangeError('sequence: se esperaba número')
        return { orderId: text(s, 'orderId'), address: text(s, 'address'), sequence: s.sequence, status: status as DeliveryStatus }
      }),
    }
  })
}

/** Paradas que aún no tienen un resultado final. */
export function openStops(route: TrackedRoute): number {
  return route.stops.filter((s) => s.status !== 'DELIVERED' && s.status !== 'NOT_DELIVERED').length
}
