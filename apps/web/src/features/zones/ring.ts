import type { Coordinate } from '@/features/geo/types'
import { isConvexPolygon, MIN_ZONE_VERTICES } from './geometry'

/** Mensaje cuando un clic dejaría la zona fuera de la forma permitida. */
export const VERTEX_REJECTED_MESSAGE =
  'Ese punto deja la zona no convexa. Elige un punto que mantenga la forma de trapecio o cuadrado.'

export interface AddVertexResult {
  points: Coordinate[]
  /** Motivo por el que el vértice no se agregó, o null si se agregó (o era un clic repetido). */
  error: string | null
}

function samePoint(a: Coordinate, b: Coordinate): boolean {
  return a.latitude === b.latitude && a.longitude === b.longitude
}

/**
 * Agrega un vértice al final del trazo. Un clic idéntico al anterior se ignora sin error.
 * Un vértice que deja la figura no convexa se rechaza y el trazo queda igual.
 */
export function addVertex(points: readonly Coordinate[], point: Coordinate): AddVertexResult {
  const last = points[points.length - 1]
  if (last !== undefined && samePoint(last, point)) {
    return { points: [...points], error: null }
  }
  const candidate = [...points, point]
  if (candidate.length >= 3 && !isConvexPolygon(candidate)) {
    return { points: [...points], error: VERTEX_REJECTED_MESSAGE }
  }
  return { points: candidate, error: null }
}

/** Quita el vértice en la posición indicada. Quitar de un polígono convexo lo deja convexo. */
export function removeVertex(points: readonly Coordinate[], index: number): Coordinate[] {
  return points.filter((_, i) => i !== index)
}

/**
 * Cierra el trazo repitiendo el primer punto al final, como exige zones.v1.
 * Devuelve null si todavía no hay suficientes vértices.
 */
export function closeRing(points: readonly Coordinate[]): Coordinate[] | null {
  if (points.length < MIN_ZONE_VERTICES) return null
  const first = points[0]
  if (first === undefined) return null
  return [...points, { latitude: first.latitude, longitude: first.longitude }]
}
