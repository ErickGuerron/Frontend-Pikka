import type { Coordinate } from '@/features/geo/types'
import { convexHull, MIN_ZONE_VERTICES } from './geometry'

function samePoint(a: Coordinate, b: Coordinate): boolean {
  return a.latitude === b.latitude && a.longitude === b.longitude
}

/**
 * Agrega un punto marcado. Un punto repetido se ignora. Cualquier posición es válida:
 * la forma de la zona se recalcula sola a partir de todos los puntos (ver convexHull).
 */
export function addPoint(points: readonly Coordinate[], point: Coordinate): Coordinate[] {
  if (points.some((p) => samePoint(p, point))) return [...points]
  return [...points, point]
}

/** Quita un punto marcado, identificado por sus coordenadas. */
export function removePoint(points: readonly Coordinate[], target: Coordinate): Coordinate[] {
  return points.filter((p) => !samePoint(p, target))
}

/**
 * Quita el último vértice de la zona. Los puntos interiores no se dibujan, así que
 * se saltan: deshacer siempre cambia algo visible.
 */
export function removeLastVertex(points: readonly Coordinate[]): Coordinate[] {
  const vertices = zoneVertices(points)
  for (let i = points.length - 1; i >= 0; i--) {
    const point = points[i]
    if (point !== undefined && isZoneVertex(point, vertices)) return removePoint(points, point)
  }
  return [...points]
}

/** Vértices de la zona: la envoltura convexa de los puntos marcados. */
export function zoneVertices(points: readonly Coordinate[]): Coordinate[] {
  return convexHull(points)
}

/**
 * Cierra los vértices repitiendo el primero al final, como exige zones.v1.
 * Devuelve null si la zona todavía no tiene suficientes vértices.
 */
export function closeRing(vertices: readonly Coordinate[]): Coordinate[] | null {
  if (vertices.length < MIN_ZONE_VERTICES) return null
  const first = vertices[0]
  if (first === undefined) return null
  return [...vertices, { latitude: first.latitude, longitude: first.longitude }]
}

/** Un punto marcado es vértice si está en la envoltura; si no, queda dentro de la zona y no se dibuja. */
export function isZoneVertex(point: Coordinate, vertices: readonly Coordinate[]): boolean {
  return vertices.some((v) => samePoint(v, point))
}
