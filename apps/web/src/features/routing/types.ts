export interface PlannedStop {
  orderId: string
  address: string
  /** Orden de visita dentro de la ruta, empezando en 1. */
  sequence: number
}

export interface GeneratedRoute {
  id: string
  driverId: string
  driverName: string
  stops: PlannedStop[]
}

/** Resultado de generar rutas: las rutas armadas y los pedidos que no pudieron asignarse. */
export interface RoutePlan {
  id: string
  routes: GeneratedRoute[]
  unassignedOrderIds: string[]
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

function list(obj: Record<string, unknown>, key: string): unknown[] {
  const value = obj[key]
  if (!Array.isArray(value)) throw new RangeError(`${key}: se esperaba una lista`)
  return value
}

export function parseRoutePlan(data: unknown): RoutePlan {
  const o = record(data, 'route plan')
  return {
    id: text(o, 'id'),
    routes: list(o, 'routes').map((item) => {
      const r = record(item, 'route')
      return {
        id: text(r, 'id'),
        driverId: text(r, 'driverId'),
        driverName: text(r, 'driverName'),
        stops: list(r, 'stops').map((stop) => {
          const s = record(stop, 'stop')
          if (typeof s.sequence !== 'number') throw new RangeError('sequence: se esperaba número')
          return { orderId: text(s, 'orderId'), address: text(s, 'address'), sequence: s.sequence }
        }),
      }
    }),
    unassignedOrderIds: list(o, 'unassignedOrderIds').map((id) => {
      if (typeof id !== 'string') throw new RangeError('unassignedOrderIds: se esperaba texto')
      return id
    }),
  }
}

/**
 * Parses the real response of POST /api/v1/routes/plan (gateway contract, phase 1):
 * planId, routes[{routeId, driverId, driverName, orderCount, stops}], unassignedOrderIds.
 * The plan id is derived by the backend and is not persisted; it is only a label.
 */
export function parseGeneratedRoutePlan(data: unknown): RoutePlan {
  const o = record(data, 'generated route plan')
  return {
    id: text(o, 'planId'),
    routes: list(o, 'routes').map((item) => {
      const r = record(item, 'generated route')
      return {
        id: text(r, 'routeId'),
        driverId: text(r, 'driverId'),
        driverName: text(r, 'driverName'),
        stops: list(r, 'stops').map((stop) => {
          const s = record(stop, 'stop')
          if (typeof s.sequence !== 'number') throw new RangeError('sequence: se esperaba numero')
          return { orderId: text(s, 'orderId'), address: text(s, 'address'), sequence: s.sequence }
        }),
      }
    }),
    unassignedOrderIds: list(o, 'unassignedOrderIds').map((id) => {
      if (typeof id !== 'string') throw new RangeError('unassignedOrderIds: se esperaba texto')
      return id
    }),
  }
}
