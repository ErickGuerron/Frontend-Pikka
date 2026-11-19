import type { RouteStop } from './types'

/** A stop as Google Maps expects it: the stored coordinates when known (same point the in-app map draws), else the address. */
function stopTarget(stop: RouteStop): string {
  return stop.latitude !== undefined && stop.longitude !== undefined
    ? `${String(stop.latitude)},${String(stop.longitude)}`
    : stop.address
}

/**
 * Google Maps directions through the given stops, in the order passed (the optimal order). Coordinates are
 * preferred over the address text: Google would otherwise geocode the text itself and pin a different place
 * than the in-app map, which uses the coordinates stored with the order.
 */
export function externalRouteUrl(stops: readonly RouteStop[]): string | null {
  const targets = stops.map(stopTarget)
  const destination = targets[targets.length - 1]
  if (destination === undefined) return null
  const waypoints = targets.slice(0, -1)
  const params = [
    'api=1',
    `destination=${encodeURIComponent(destination)}`,
    ...(waypoints.length > 0 ? [`waypoints=${encodeURIComponent(waypoints.join('|'))}`] : []),
  ]
  return `https://www.google.com/maps/dir/?${params.join('&')}`
}
