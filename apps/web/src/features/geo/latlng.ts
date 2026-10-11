import type { Coordinate } from './types'

/** Convierte puntos al formato [lat, lng] que usa Leaflet. */
export function toLatLngTuples(points: readonly Coordinate[]): [number, number][] {
  return points.map((p) => [p.latitude, p.longitude])
}
