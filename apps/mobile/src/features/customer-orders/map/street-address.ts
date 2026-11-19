import { distanceMeters } from '../../driver-route/stop-sort'
import type { Coordinate } from './geo'
import type { Place } from './photon'

/**
 * Distancia maxima entre el punto y una segunda calle para llamarlo cruce. Photon devuelve un punto por via (a
 * 60-200 m en Quito, medido en vivo), no la interseccion exacta: es una aproximacion y 100 m la cubre.
 */
export const INTERSECTION_RADIUS_M = 100

/**
 * Direccion con calles, no con la ciudad: "Av. A y Calle B, Ciudad, Pais" cuando otra calle distinta esta cerca
 * del punto, o "Av. A, Ciudad, Pais" con una sola. Recibe las calles mas cercanas (ya filtradas a vias). Devuelve
 * null sin calles: en ese caso no se autollena la direccion con la ciudad.
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
