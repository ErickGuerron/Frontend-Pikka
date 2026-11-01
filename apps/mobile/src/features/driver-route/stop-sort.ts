import type { Coordinate } from '../customer-orders/map/geo'
import type { RouteStop } from './types'

/** Ways to order the active stops in the picker. Every one uses data the app already has. */
export type StopSort = 'route' | 'nearest' | 'waiting' | 'deadline'

export const PAGE_SIZE = 5

export const SORT_LABELS: Record<StopSort, string> = {
  route: 'Ruta óptima',
  nearest: 'Más cercanas',
  waiting: 'Más tiempo en espera',
  deadline: 'Vence antes',
}

const EARTH_RADIUS_M = 6_371_000

/** Straight-line distance in meters between two points (haversine). */
export function distanceMeters(a: Coordinate, b: Coordinate): number {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLon = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${String(Math.round(meters))} m` : `${(meters / 1000).toFixed(1)} km`
}

/** Distance from the driver to the stop, or null when either point is unknown. */
export function stopDistance(stop: RouteStop, driver: Coordinate | null): number | null {
  if (driver === null || stop.latitude === undefined || stop.longitude === undefined) return null
  return distanceMeters(driver, { latitude: stop.latitude, longitude: stop.longitude })
}

/** "HH:mm" to minutes; an unreadable value sorts last. */
function minutes(hhmm: string): number {
  const match = /^(\d{1,2}):(\d{2})/.exec(hhmm)
  return match === null ? Number.POSITIVE_INFINITY : Number(match[1]) * 60 + Number(match[2])
}

/**
 * Orders stops for the picker without mutating the input. `route` keeps the given (optimal) order; `nearest` needs the
 * driver's position and otherwise falls back to it; `waiting` puts the window that opened earliest first (the customer
 * has been waiting longest); `deadline` puts the window that closes first on top. Ties keep the route order.
 */
export function sortStops(stops: readonly RouteStop[], sort: StopSort, driver: Coordinate | null): RouteStop[] {
  const indexed = stops.map((stop, index) => ({ stop, index }))
  const key = (stop: RouteStop): number => {
    switch (sort) {
      case 'nearest': return stopDistance(stop, driver) ?? Number.POSITIVE_INFINITY
      case 'waiting': return minutes(stop.windowStart)
      case 'deadline': return minutes(stop.windowEnd)
      case 'route': return 0
    }
  }
  if (sort === 'route' || (sort === 'nearest' && driver === null)) return indexed.map((e) => e.stop)
  return indexed.sort((a, b) => key(a.stop) - key(b.stop) || a.index - b.index).map((e) => e.stop)
}

/** One page of `PAGE_SIZE` items; an out-of-range page is clamped and an empty list still has one page. */
export function paginate<T>(items: readonly T[], page: number): { items: T[]; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const current = Math.min(Math.max(0, page), pages - 1)
  return { items: items.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE), page: current, pages }
}
