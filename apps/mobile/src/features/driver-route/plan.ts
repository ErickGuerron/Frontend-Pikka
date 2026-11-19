import { isRecord } from '../../api/parse'
import type { Coordinate } from '../customer-orders/map/geo'

/** Ruta óptima del repartidor (GET /drivers/me/route/plan). Geometry ya viene convertida a lat,lon. */
export interface RoutePlan {
  /** Ids de las paradas activas en el orden óptimo. */
  order: string[]
  distanceMeters: number
  durationSeconds: number
  geometry: Coordinate[]
}

/** Lee la respuesta del gateway. Un cuerpo que no es un plan lanza error; nunca se inventa una ruta. */
export function parseRoutePlan(data: unknown): RoutePlan {
  if (!isRecord(data)) throw new Error('route plan: expected object')
  const { order, distanceMeters, durationSeconds, geometry } = data
  if (!Array.isArray(order) || !order.every((id) => typeof id === 'string')) {
    throw new Error('route plan: order must be a list of stop ids')
  }
  if (typeof distanceMeters !== 'number' || typeof durationSeconds !== 'number') {
    throw new Error('route plan: totals must be numbers')
  }
  if (!Array.isArray(geometry)) throw new Error('route plan: geometry must be a list')
  return {
    order,
    distanceMeters,
    durationSeconds,
    geometry: geometry.map((pair) => {
      if (!Array.isArray(pair) || typeof pair[0] !== 'number' || typeof pair[1] !== 'number') {
        throw new Error('route plan: geometry point must be [lat, lon]')
      }
      return { latitude: pair[0], longitude: pair[1] }
    }),
  }
}
