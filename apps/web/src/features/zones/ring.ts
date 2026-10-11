import type { Coordinate } from '@/features/geo/types'

/** Mínimo de vértices distintos para cerrar un polígono (triángulo). */
export const MIN_VERTICES = 3

/** Agrega un vértice al final del trazo. Ignora un punto idéntico al anterior. */
export function appendVertex(points: readonly Coordinate[], point: Coordinate): Coordinate[] {
  const last = points[points.length - 1]
  if (last !== undefined && last.latitude === point.latitude && last.longitude === point.longitude) {
    return [...points]
  }
  return [...points, point]
}

/**
 * Cierra el trazo repitiendo el primer punto al final, como exige zones.v1.
 * Devuelve null si todavía no hay suficientes vértices.
 */
export function closeRing(points: readonly Coordinate[]): Coordinate[] | null {
  if (points.length < MIN_VERTICES) return null
  const first = points[0]
  if (first === undefined) return null
  return [...points, { latitude: first.latitude, longitude: first.longitude }]
}
