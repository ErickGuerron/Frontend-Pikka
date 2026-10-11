import type { Coordinate } from '@/features/geo/types'

/** Una zona es un trapecio o un cuadrado como mínimo: nunca un triángulo. */
export const MIN_ZONE_VERTICES = 4

/** Absorbe el error de punto flotante al sumar los giros. */
const ANGLE_TOLERANCE = 1e-6

/**
 * Indica si los vértices (sin repetir el punto de cierre) forman un polígono
 * convexo y simple. Es la misma regla que el dominio del Zone Service (shape.go):
 * cada esquina gira hacia el mismo lado, ninguna es plana, y la suma de giros es
 * exactamente una vuelta. Así se descartan lados cruzados, muescas y estrellas.
 */
export function isConvexPolygon(vertices: readonly Coordinate[]): boolean {
  const n = vertices.length
  if (n < 3) return false

  let turnSide = 0
  let totalTurn = 0
  for (let i = 0; i < n; i++) {
    const a = vertices[i]
    const b = vertices[(i + 1) % n]
    const c = vertices[(i + 2) % n]
    if (a === undefined || b === undefined || c === undefined) return false

    // Lados consecutivos: longitud es x, latitud es y.
    const e1x = b.longitude - a.longitude
    const e1y = b.latitude - a.latitude
    const e2x = c.longitude - b.longitude
    const e2y = c.latitude - b.latitude

    const cross = e1x * e2y - e1y * e2x
    if (cross === 0) return false
    const side = Math.sign(cross)
    if (turnSide === 0) turnSide = side
    else if (side !== turnSide) return false
    totalTurn += Math.atan2(cross, e1x * e2x + e1y * e2y)
  }

  return Math.abs(Math.abs(totalTurn) - 2 * Math.PI) < ANGLE_TOLERANCE
}

/**
 * Motivo por el que una figura no puede guardarse como zona, o null si es válida.
 * Los mensajes son los que ve el usuario.
 */
export function zoneShapeError(vertices: readonly Coordinate[]): string | null {
  if (vertices.length < MIN_ZONE_VERTICES) {
    return `Necesitas al menos ${String(MIN_ZONE_VERTICES)} vértices para formar la zona.`
  }
  if (!isConvexPolygon(vertices)) {
    return 'La zona debe ser convexa: sus lados no pueden cruzarse ni tener esquinas hacia adentro.'
  }
  return null
}
