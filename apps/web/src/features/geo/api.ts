import { parsePhotonFeatures, type Place } from './photon'

/**
 * Geocodificación con Photon (Komoot), sobre datos de OpenStreetMap.
 * Va directo al servicio externo, sin el cliente de shared/api/http.ts: ese cliente
 * envía el token de sesión a nuestro Gateway, y nunca debe enviarse a un tercero.
 *
 * Instancia pública: solo para volumen bajo. En producción conviene un Photon
 * propio (imagen Docker oficial) y cambiar PHOTON_URL.
 */
export const PHOTON_URL = 'https://photon.komoot.io'

const SEARCH_LIMIT = 5

/** Busca calles y lugares. Devuelve hasta SEARCH_LIMIT resultados. */
export function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const url = `${PHOTON_URL}/api/?q=${encodeURIComponent(query)}&limit=${String(SEARCH_LIMIT)}`
  return fetchPlaces(url, signal)
}

/** Devuelve el lugar más cercano a una coordenada, o null si no hay ninguno. */
export async function reversePlace(latitude: number, longitude: number, signal?: AbortSignal): Promise<Place | null> {
  const url = `${PHOTON_URL}/reverse?lat=${String(latitude)}&lon=${String(longitude)}&limit=1`
  const [first] = await fetchPlaces(url, signal)
  return first ?? null
}

async function fetchPlaces(url: string, signal?: AbortSignal): Promise<Place[]> {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: signal ?? null })
  if (!response.ok) throw new Error(`geocoder HTTP ${String(response.status)}`)
  const body: unknown = await response.json()
  return parsePhotonFeatures(body)
}
