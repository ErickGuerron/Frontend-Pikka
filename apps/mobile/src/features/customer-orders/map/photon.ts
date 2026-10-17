import { isRecord, ParseError } from '../../../api/parse'

/**
 * Geocodificación inversa con Photon (Komoot, datos de OpenStreetMap), igual que la web.
 * Va directo al servicio externo y sin pasar por el cliente HTTP de la app: ese cliente envía el
 * token de sesión a nuestro Gateway y nunca debe enviarse a un tercero.
 *
 * Instancia pública: solo para volumen bajo. En producción conviene un Photon propio.
 */
export const PHOTON_URL = 'https://photon.komoot.io'

/** Sin respuesta en este tiempo, la búsqueda se da por fallida para no dejar la pantalla esperando. */
export const PHOTON_TIMEOUT_MS = 8000

export interface Place {
  /** Nombre del lugar (calle, comercio, barrio...). */
  name: string
  /** Dirección legible, sin el nombre del lugar. */
  address: string
  latitude: number
  longitude: number
}

/** Valida la respuesta de Photon sin type assertions y descarta entradas incompletas. */
export function parsePhotonFeatures(data: unknown): Place[] {
  if (!isRecord(data) || !Array.isArray(data.features)) throw new ParseError('photon: expected features array')
  const places: Place[] = []
  for (const feature of data.features as unknown[]) {
    const place = parseFeature(feature)
    if (place !== null) places.push(place)
  }
  return places
}

function parseFeature(feature: unknown): Place | null {
  if (!isRecord(feature) || !isRecord(feature.geometry) || !isRecord(feature.properties)) return null
  const coords = feature.geometry.coordinates
  // GeoJSON: [longitud, latitud].
  if (!Array.isArray(coords) || typeof coords[0] !== 'number' || typeof coords[1] !== 'number') return null
  const props = feature.properties
  const street = optionalString(props, 'street')
  const houseNumber = optionalString(props, 'housenumber')
  const streetLine = [street, houseNumber].filter((part) => part !== '').join(' ')
  const name = optionalString(props, 'name') || streetLine
  if (name === '') return null
  return {
    name,
    address: formatAddress(props, streetLine === name ? '' : streetLine),
    latitude: coords[1],
    longitude: coords[0],
  }
}

/** Arma la dirección: calle y número, barrio, ciudad y país, sin repetir partes. */
function formatAddress(props: Record<string, unknown>, streetLine: string): string {
  const parts = [
    streetLine,
    optionalString(props, 'district'),
    optionalString(props, 'city') || optionalString(props, 'town') || optionalString(props, 'village'),
    optionalString(props, 'country'),
  ].filter((part) => part !== '')
  return parts.filter((part, i) => parts.indexOf(part) === i).join(', ')
}

function optionalString(obj: Record<string, unknown>, key: string): string {
  const value = obj[key]
  return typeof value === 'string' ? value.trim() : ''
}

/** Devuelve el lugar más cercano a una coordenada, o null si no hay ninguno. */
export async function reversePlace(latitude: number, longitude: number, signal?: AbortSignal): Promise<Place | null> {
  const url = `${PHOTON_URL}/reverse?lat=${String(latitude)}&lon=${String(longitude)}&limit=1`
  const controller = new AbortController()
  const cancel = () => { controller.abort() }
  const timer = setTimeout(cancel, PHOTON_TIMEOUT_MS)
  signal?.addEventListener('abort', cancel)
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal })
    if (!response.ok) throw new Error(`geocoder HTTP ${String(response.status)}`)
    const body: unknown = await response.json()
    return parsePhotonFeatures(body)[0] ?? null
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}

/** Primer lugar que devuelve Photon para una dirección escrita, sesgado a Quito; null si no hay ninguno. */
export async function searchPlace(query: string, signal?: AbortSignal): Promise<Place | null> {
  const url = `${PHOTON_URL}/api/?q=${encodeURIComponent(query)}&limit=1&lat=-0.18&lon=-78.47`
  const controller = new AbortController()
  const cancel = () => { controller.abort() }
  const timer = setTimeout(cancel, PHOTON_TIMEOUT_MS)
  signal?.addEventListener('abort', cancel)
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal })
    if (!response.ok) throw new Error(`geocoder HTTP ${String(response.status)}`)
    const body: unknown = await response.json()
    return parsePhotonFeatures(body)[0] ?? null
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}
