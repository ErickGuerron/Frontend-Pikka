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

/** Producto cruzado de oa y ob: positivo si o→a→b gira a la izquierda, negativo si gira a la derecha. */
function cross(o: Coordinate, a: Coordinate, b: Coordinate): number {
  return (a.longitude - o.longitude) * (b.latitude - o.latitude) - (a.latitude - o.latitude) * (b.longitude - o.longitude)
}

/**
 * Envoltura convexa de los puntos (Andrew, monotone chain). Devuelve los vértices
 * exteriores en sentido antihorario. Un punto dentro de la figura no es un vértice
 * y queda fuera del resultado; un punto sobre un lado tampoco, porque no es una esquina.
 *
 * Por construcción el resultado siempre es convexo, sin importar en qué orden o dónde
 * se marquen los puntos. Así el usuario no necesita acertar la forma.
 */
export function convexHull(points: readonly Coordinate[]): Coordinate[] {
  const sorted = [...points].sort((p, q) => p.longitude - q.longitude || p.latitude - q.latitude)
  const unique: Coordinate[] = []
  for (const p of sorted) {
    const previous = unique[unique.length - 1]
    if (previous === undefined || previous.latitude !== p.latitude || previous.longitude !== p.longitude) unique.push(p)
  }
  if (unique.length < 3) return unique

  const lower = buildChain(unique)
  const upper = buildChain([...unique].reverse())
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

/** Cadena inferior (o superior, si se recibe en orden inverso) de la envoltura. */
function buildChain(ordered: readonly Coordinate[]): Coordinate[] {
  const chain: Coordinate[] = []
  for (const p of ordered) {
    let a = chain[chain.length - 2]
    let b = chain[chain.length - 1]
    while (chain.length >= 2 && a !== undefined && b !== undefined && cross(a, b, p) <= 0) {
      chain.pop()
      a = chain[chain.length - 2]
      b = chain[chain.length - 1]
    }
    chain.push(p)
  }
  return chain
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
