import type { Coordinate } from '@/features/geo/types'
import { isConvexPolygon, MIN_ZONE_VERTICES } from './geometry'

/** Mensaje cuando un clic no puede colocarse sin romper la forma permitida. */
export const VERTEX_REJECTED_MESSAGE =
  'Ese punto deja la zona no convexa. Elige un punto que mantenga la forma de trapecio o cuadrado.'

/** Con menos de tres vértices no hay figura todavía: el punto se agrega al final. */
const MIN_SHAPE_FOR_INSERTION = 3

export interface AddVertexResult {
  points: Coordinate[]
  /** Motivo por el que el vértice no se agregó, o null si se agregó (o era un clic repetido). */
  error: string | null
}

function samePoint(a: Coordinate, b: Coordinate): boolean {
  return a.latitude === b.latitude && a.longitude === b.longitude
}

/** Distancia (en grados) del punto al segmento ab. Basta para elegir la arista más cercana. */
function distanceToSegment(p: Coordinate, a: Coordinate, b: Coordinate): number {
  const dx = b.longitude - a.longitude
  const dy = b.latitude - a.latitude
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((p.longitude - a.longitude) * dx + (p.latitude - a.latitude) * dy) / lengthSquared))
  const x = a.longitude + t * dx
  const y = a.latitude + t * dy
  return Math.hypot(p.longitude - x, p.latitude - y)
}

/**
 * Coloca un vértice nuevo en la arista de la figura más cercana que mantiene la
 * forma convexa. Así, un vértice quitado vuelve a su sitio al hacer clic de nuevo.
 * Devuelve null si ninguna posición sirve (por ejemplo, un punto dentro de la figura).
 */
function insertIntoConvexShape(points: readonly Coordinate[], point: Coordinate): Coordinate[] | null {
  const n = points.length
  // La posición k inserta antes de points[k]; k = n equivale a agregar al final (cierra con points[0]).
  const candidates: { position: number; distance: number }[] = []
  for (let k = 1; k <= n; k++) {
    const before = points[k - 1]
    const after = points[k % n]
    if (before === undefined || after === undefined) continue
    candidates.push({ position: k, distance: distanceToSegment(point, before, after) })
  }
  candidates.sort((x, y) => x.distance - y.distance)

  for (const { position } of candidates) {
    const next = [...points.slice(0, position), point, ...points.slice(position)]
    if (isConvexPolygon(next)) return next
  }
  return null
}

/**
 * Agrega un vértice al trazo. Un clic idéntico al anterior se ignora sin error.
 * El vértice se coloca en la arista que mantiene la figura convexa; si ninguna la
 * mantiene, se rechaza y el trazo queda igual.
 */
export function addVertex(points: readonly Coordinate[], point: Coordinate): AddVertexResult {
  const last = points[points.length - 1]
  if (last !== undefined && samePoint(last, point)) {
    return { points: [...points], error: null }
  }

  if (points.length < MIN_SHAPE_FOR_INSERTION) {
    const candidate = [...points, point]
    if (candidate.length === MIN_SHAPE_FOR_INSERTION && !isConvexPolygon(candidate)) {
      return { points: [...points], error: VERTEX_REJECTED_MESSAGE }
    }
    return { points: candidate, error: null }
  }

  const inserted = insertIntoConvexShape(points, point)
  if (inserted === null) {
    return { points: [...points], error: VERTEX_REJECTED_MESSAGE }
  }
  return { points: inserted, error: null }
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
