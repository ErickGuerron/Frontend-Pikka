import { http } from '@/shared/api/client'
import { holeFitError, zoneShapeError } from './geometry'
import type { ZoneSettings } from './settings'
import { type Coordinate, type Zone, type ZoneStatus, isClosedRing, parseZone } from './types'

/** Geometría, nombre y configuración de una zona. El código lo genera el servidor y no cambia después. */
export interface ZoneDraft {
  name: string
  /** Anillo exterior cerrado: el primer punto coincide con el último. */
  ring: Coordinate[]
  /** Huecos opcionales (dona), cada uno cerrado. */
  holes?: Coordinate[][]
  /** Depósito, capacidad, horario, cortes y prioridad. Obligatoria: el backend la exige. */
  settings: ZoneSettings
  /** Versión que el usuario vio al abrir la zona. Solo al redibujar; 0 o ausente = sin control. */
  expectedVersion?: number | undefined
}

/** Rutas publicadas en contracts/openapi/openapi.yaml (Backend-Pikka). */
export function getZone(id: string): Promise<Zone> {
  return http.get(`/api/v1/zones/${encodeURIComponent(id)}`, parseZone)
}

/** Todas las zonas registradas, activas o no. Lo usan ADMIN y OPERATOR. */
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
function zoneDraftError(draft: ZoneDraft): string | null {
  if (!isClosedRing(draft.ring)) return 'ring: el anillo debe cerrarse sobre su primer punto'
  const outer = draft.ring.slice(0, -1)
  const shapeError = zoneShapeError(outer)
  if (shapeError !== null) return `ring: ${shapeError}`

  const placed: Coordinate[][] = []
  for (const hole of draft.holes ?? []) {
    if (!isClosedRing(hole)) return 'holes: cada hueco debe cerrarse sobre su primer punto'
    const vertices = hole.slice(0, -1)
    const fitError = holeFitError(vertices, outer, placed)
    if (fitError !== null) return `holes: ${fitError}`
    placed.push(vertices)
  }
  return null
}

/** Cuerpo de la petición: sin huecos ni versión se omiten, como espera el backend. */
function zoneBody(draft: ZoneDraft): ZoneDraft {
  const body: ZoneDraft = { name: draft.name, ring: draft.ring, settings: draft.settings }
  const holes = draft.holes ?? []
  if (holes.length > 0) body.holes = holes
  if (draft.expectedVersion !== undefined && draft.expectedVersion > 0) body.expectedVersion = draft.expectedVersion
  return body
}

/**
 * Crea una zona. El código lo asigna el servidor a partir del nombre (NORTE-001).
 * Rechaza en el cliente figuras inválidas antes de llamar a la API.
 */
export function createZone(draft: ZoneDraft): Promise<Zone> {
  const error = zoneDraftError(draft)
  if (error !== null) return Promise.reject(new RangeError(error))
  return http.post('/api/v1/zones', parseZone, { body: zoneBody(draft) })
}

/** Redibuja una zona activa con las mismas reglas que la creación. El código no cambia. */
export function updateZone(id: string, draft: ZoneDraft): Promise<Zone> {
  const error = zoneDraftError(draft)
  if (error !== null) return Promise.reject(new RangeError(error))
  return http.put(`/api/v1/zones/${encodeURIComponent(id)}`, parseZone, { body: zoneBody(draft) })
}

/** Activa o desactiva una zona. El motivo es obligatorio y queda en la bitácora. */
export function setZoneStatus(id: string, status: ZoneStatus, reason: string): Promise<Zone> {
  return http.patch(`/api/v1/zones/${encodeURIComponent(id)}/status`, parseZone, { body: { status, reason } })
}

/** Borra una zona inactiva. La API responde 204 sin cuerpo. */
export function deleteZone(id: string, reason: string): Promise<void> {
  return http.delete(`/api/v1/zones/${encodeURIComponent(id)}`, () => undefined, { body: { reason } })
}

/** Devuelve la zona activa que contiene una coordenada. La API responde 404 si ninguna la contiene. */
export function classifyPoint(point: Coordinate, signal?: AbortSignal): Promise<Zone> {
  const query = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
  })
  return http.get(`/api/v1/zones/classify?${query.toString()}`, parseZone, { signal })
}
