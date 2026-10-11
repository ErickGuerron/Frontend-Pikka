import { http } from '@/shared/api/client'
import { holeFitError, zoneShapeError } from './geometry'
import { type Coordinate, type Zone, isClosedRing, parseZone } from './types'

export interface NewZone {
  code: string
  name: string
  /** Anillo exterior cerrado: el primer punto coincide con el último. */
  ring: Coordinate[]
  /** Huecos opcionales (dona), cada uno cerrado. */
  holes?: Coordinate[][]
}

/** Rutas publicadas en contracts/openapi/openapi.yaml (Backend-Pikka). */
export function getZone(id: string): Promise<Zone> {
  return http.get(`/api/v1/zones/${encodeURIComponent(id)}`, parseZone)
}

/** Todas las zonas registradas. Lo usan ADMIN y OPERATOR. */
export function listZones(): Promise<Zone[]> {
  return http.get('/api/v1/zones', (data) => {
    if (!Array.isArray(data)) throw new RangeError('zones: se esperaba una lista')
    return data.map((zone) => parseZone(zone))
  })
}

/**
 * Valida la figura en el cliente: anillo exterior y huecos cerrados, convexos, y cada hueco
 * dentro del exterior sin tocar otro. Devuelve el motivo o null. El backend vuelve a validarlo.
 */
function zoneInputError(input: NewZone): string | null {
  if (!isClosedRing(input.ring)) return 'ring: el anillo debe cerrarse sobre su primer punto'
  const outer = input.ring.slice(0, -1)
  const shapeError = zoneShapeError(outer)
  if (shapeError !== null) return `ring: ${shapeError}`

  const placed: Coordinate[][] = []
  for (const hole of input.holes ?? []) {
    if (!isClosedRing(hole)) return 'holes: cada hueco debe cerrarse sobre su primer punto'
    const vertices = hole.slice(0, -1)
    const fitError = holeFitError(vertices, outer, placed)
    if (fitError !== null) return `holes: ${fitError}`
    placed.push(vertices)
  }
  return null
}

/** Cuerpo de la petición: sin huecos se envía como antes; el backend acepta el campo opcional. */
function zoneBody(input: NewZone): NewZone {
  return (input.holes ?? []).length > 0 ? input : { code: input.code, name: input.name, ring: input.ring }
}

/**
 * Registra una zona. Rechaza en el cliente figuras inválidas antes de llamar a la API.
 */
export function createZone(input: NewZone): Promise<Zone> {
  const error = zoneInputError(input)
  if (error !== null) return Promise.reject(new RangeError(error))
  return http.post('/api/v1/zones', parseZone, { body: zoneBody(input) })
}

/** Redibuja una zona existente con las mismas reglas que la creación. */
export function updateZone(id: string, input: NewZone): Promise<Zone> {
  const error = zoneInputError(input)
  if (error !== null) return Promise.reject(new RangeError(error))
  return http.put(`/api/v1/zones/${encodeURIComponent(id)}`, parseZone, { body: zoneBody(input) })
}

/** Devuelve la zona que contiene una coordenada. La API responde 404 si ninguna la contiene. */
export function classifyPoint(point: Coordinate, signal?: AbortSignal): Promise<Zone> {
  const query = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
  })
  return http.get(`/api/v1/zones/classify?${query.toString()}`, parseZone, { signal })
}
