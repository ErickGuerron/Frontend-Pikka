import type { Coordinate } from './types'
import type { Place } from './photon'

/** Distancia maxima entre el punto y una segunda calle para llamarlo cruce. */
export const INTERSECTION_RADIUS_M = 100

const EARTH_RADIUS_M = 6_371_000

/** Distancia en metros (haversine). */
function distanceMeters(a: Coordinate, b: Coordinate): number {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLon = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Direccion con calles, no con la ciudad: "Av. A y Calle B, Ciudad, Pais" cuando otra calle distinta esta cerca
 * del punto, o "Av. A, Ciudad, Pais" con una sola. Recibe las calles mas cercanas (ya filtradas a vias). Devuelve
 * null sin calles. Photon da un punto por via, no la interseccion exacta: el cruce es una aproximacion.
 */
export function streetAddressFrom(streets: readonly Place[], point: Coordinate): string | null {
  const first = streets[0]
  if (first === undefined) return null
  const cross = streets.find(
    (street) => street.name !== first.name && distanceMeters(point, street) <= INTERSECTION_RADIUS_M,
  )
  const label = cross === undefined ? first.name : `${first.name} y ${cross.name}`
  return [label, first.address].filter((part) => part !== '').join(', ')
}
