import { isRecord, ParseError, string } from '../../../api/parse'

/** Punto geográfico en grados decimales (WGS 84). */
export interface Coordinate {
  latitude: number
  longitude: number
}

/** Zona de cobertura tal como la ve cualquier usuario: solo nombre y contorno. */
export interface CoverageZone {
  id: string
  code: string
  name: string
  ring: Coordinate[]
  holes: Coordinate[][]
}

function parseCoordinate(data: unknown): Coordinate {
  if (!isRecord(data) || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    throw new ParseError('coordinate: expected { latitude, longitude }')
  }
  return { latitude: data.latitude, longitude: data.longitude }
}

function parseRing(data: unknown): Coordinate[] {
  if (!Array.isArray(data)) throw new ParseError('ring: expected array')
  return data.map(parseCoordinate)
}

/** Lee la respuesta de GET /api/v1/coverage/zones. */
export function parseCoverageZones(data: unknown): CoverageZone[] {
  if (!isRecord(data) || !Array.isArray(data.zones)) throw new ParseError('zones: expected list')
  return data.zones.map((item: unknown) => {
    if (!isRecord(item)) throw new ParseError('zone: expected object')
    const holes = item.holes === undefined || item.holes === null ? [] : item.holes
    if (!Array.isArray(holes)) throw new ParseError('holes: expected array')
    return {
      id: string(item, 'id'),
      code: string(item, 'code'),
      name: string(item, 'name'),
      ring: parseRing(item.ring),
      holes: holes.map(parseRing),
    }
  })
}

const EDGE_TOLERANCE = 1e-9

function onSegment(p: Coordinate, a: Coordinate, b: Coordinate): boolean {
  const cross = (b.longitude - a.longitude) * (p.latitude - a.latitude) - (b.latitude - a.latitude) * (p.longitude - a.longitude)
  if (Math.abs(cross) > EDGE_TOLERANCE) return false
  return (
    p.longitude >= Math.min(a.longitude, b.longitude) - EDGE_TOLERANCE &&
    p.longitude <= Math.max(a.longitude, b.longitude) + EDGE_TOLERANCE &&
    p.latitude >= Math.min(a.latitude, b.latitude) - EDGE_TOLERANCE &&
    p.latitude <= Math.max(a.latitude, b.latitude) + EDGE_TOLERANCE
  )
}

/** Posición del punto respecto de un anillo: dentro, sobre el borde o fuera (ray casting). */
function ringPosition(p: Coordinate, ring: readonly Coordinate[]): 'inside' | 'edge' | 'outside' {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[i]
    const b = ring[j]
    if (a === undefined || b === undefined) continue
    if (onSegment(p, a, b)) return 'edge'
    const crosses =
      a.latitude > p.latitude !== b.latitude > p.latitude &&
      p.longitude < ((b.longitude - a.longitude) * (p.latitude - a.latitude)) / (b.latitude - a.latitude) + a.longitude
    if (crosses) inside = !inside
  }
  return inside ? 'inside' : 'outside'
}

/**
 * Zona que cubre el punto, o null. El borde cuenta como cubierto (igual que la clasificación del backend)
 * y el interior de un hueco no. Es la misma regla que usa la web.
 */
export function zoneCovering(point: Coordinate, zones: readonly CoverageZone[]): CoverageZone | null {
  return (
    zones.find((zone) => {
      if (ringPosition(point, zone.ring) === 'outside') return false
      return !zone.holes.some((hole) => ringPosition(point, hole) === 'inside')
    }) ?? null
  )
}
