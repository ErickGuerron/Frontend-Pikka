import { parsePhotonFeatures, type Place } from './photon'
import { streetAddressFrom } from './street-address'

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

/** Sin respuesta en este tiempo, la búsqueda se da por fallida para no dejar la UI esperando. */
export const PHOTON_TIMEOUT_MS = 8000

/** Busca calles y lugares. Devuelve hasta SEARCH_LIMIT resultados. */
export function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const url = `${PHOTON_URL}/api/?q=${encodeURIComponent(query)}&limit=${String(SEARCH_LIMIT)}`
  return fetchPlaces(url, signal)
}

/**
 * Direccion con las calles cercanas a la coordenada: "Av. A y Calle B, Ciudad, Pais" o "Av. A, Ciudad, Pais".
 * Pide solo vias: sin el filtro Photon devuelve la ciudad cuando no hay una calle mapeada justo en el punto.
 * Null si no hay ninguna via cercana: en ese caso no se propone la ciudad como direccion.
 */
export async function reverseStreetPlace(latitude: number, longitude: number, signal?: AbortSignal): Promise<Place | null> {
  const url = `${PHOTON_URL}/reverse?lat=${String(latitude)}&lon=${String(longitude)}&limit=5&osm_tag=highway`
  const streets = await fetchPlaces(url, signal)
  const address = streetAddressFrom(streets, { latitude, longitude })
  const first = streets[0]
  if (address === null || first === undefined) return null
  return { name: first.name, address, latitude, longitude }
}

/** Devuelve el lugar más cercano a una coordenada, o null si no hay ninguno. */
export async function reversePlace(latitude: number, longitude: number, signal?: AbortSignal): Promise<Place | null> {
  const url = `${PHOTON_URL}/reverse?lat=${String(latitude)}&lon=${String(longitude)}&limit=1`
  const [first] = await fetchPlaces(url, signal)
  return first ?? null
}

/** Cancela si el llamante cancela o si pasa el tiempo límite; lo que ocurra primero. */
async function fetchPlaces(url: string, signal?: AbortSignal): Promise<Place[]> {
  const controller = new AbortController()
  const cancel = () => { controller.abort(); }
  const timer = setTimeout(cancel, PHOTON_TIMEOUT_MS)
  signal?.addEventListener('abort', cancel)
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal })
    if (!response.ok) throw new Error(`geocoder HTTP ${String(response.status)}`)
    const body: unknown = await response.json()
    return parsePhotonFeatures(body)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}
