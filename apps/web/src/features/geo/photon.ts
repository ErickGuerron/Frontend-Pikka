import { isRecord } from '@/shared/api/http'
import { ParseError } from '@/shared/api/parse'

/**
 * Modelo y parseo de las respuestas de Photon (Komoot, datos de OpenStreetMap).
 * Las llamadas HTTP viven en ./api.ts.
 */

export interface Place {
  /** Nombre del lugar (calle, comercio, barrio...). Editable por el usuario. */
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
  for (const feature of data.features) {
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

/** Arma la dirección: calle y número, barrio, ciudad y país, sin repetir el nombre. */
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
