import { describe, expect, it } from 'vitest'
import { toLatLngTuples } from '@/features/geo/latlng'
import type { Coordinate } from '@/features/geo/types'
import { addPoint, closeRing, isZoneVertex, removeLastVertex, removePoint, zoneVertices } from './ring'

const a: Coordinate = { latitude: -0.2, longitude: -78.5 }
const b: Coordinate = { latitude: -0.2, longitude: -78.4 }
const c: Coordinate = { latitude: -0.1, longitude: -78.4 }
const d: Coordinate = { latitude: -0.1, longitude: -78.5 }
// Dentro del cuadrado: no es una esquina, queda absorbido por la zona.
const inside: Coordinate = { latitude: -0.15, longitude: -78.45 }

describe('addPoint', () => {
  it('agrega puntos al final sin mutar el arreglo original', () => {
    const start = [a, b]
    expect(addPoint(start, c)).toEqual([a, b, c])
    expect(start).toEqual([a, b])
  })

  it('ignora un punto repetido, esté o no al final', () => {
    expect(addPoint([a, b], b)).toEqual([a, b])
    expect(addPoint([a, b], a)).toEqual([a, b])
  })

  it('acepta cualquier posición: la forma se recalcula, no se rechaza', () => {
    expect(addPoint([a, b, c, d], inside)).toEqual([a, b, c, d, inside])
  })
})

describe('removePoint', () => {
  it('quita el punto con esas coordenadas sin mutar el arreglo original', () => {
    const points = [a, b, c, d]
    expect(removePoint(points, b)).toEqual([a, c, d])
    expect(points).toHaveLength(4)
  })

  it('no hace nada si el punto no está marcado', () => {
    expect(removePoint([a, b], c)).toEqual([a, b])
  })
})

describe('removeLastVertex', () => {
  it('quita el último vértice visible', () => {
    expect(removeLastVertex([a, b, c, d])).toEqual([a, b, c])
  })

  it('se salta un punto interior: deshacer siempre cambia algo visible', () => {
    // El último marcado (inside) queda dentro de a, b, c, d: se quita d, el último vértice.
    expect(removeLastVertex([a, b, c, d, inside])).toEqual([a, b, c, inside])
  })

  it('no cambia nada si no hay puntos', () => {
    expect(removeLastVertex([])).toEqual([])
  })
})

describe('zoneVertices', () => {
  it('usa las cuatro esquinas aunque haya un punto interior marcado', () => {
    const vertices = zoneVertices([a, b, c, d, inside])
    expect(vertices).toHaveLength(4)
    expect(isZoneVertex(inside, vertices)).toBe(false)
  })

  it('sigue siendo convexa al marcar en un orden cualquiera', () => {
    expect(zoneVertices([c, a, d, b])).toHaveLength(4)
  })
})

describe('closeRing', () => {
  it('no cierra con menos de cuatro vértices', () => {
    expect(closeRing([])).toBeNull()
    expect(closeRing([a, b, c])).toBeNull()
  })

  it('repite el primer vértice al final, como exige zones.v1', () => {
    const ring = closeRing([a, b, c, d])
    expect(ring).toEqual([a, b, c, d, a])
    expect(ring?.[0]).toEqual(ring?.[ring.length - 1])
  })

  it('no altera el arreglo de entrada', () => {
    const vertices = [a, b, c, d]
    closeRing(vertices)
    expect(vertices).toHaveLength(4)
  })
})

describe('toLatLngTuples', () => {
  it('convierte a [lat, lng] para Leaflet', () => {
    expect(toLatLngTuples([a])).toEqual([[-0.2, -78.5]])
  })
})
