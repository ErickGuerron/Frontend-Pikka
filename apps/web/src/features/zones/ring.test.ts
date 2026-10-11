import { describe, expect, it } from 'vitest'
import { toLatLngTuples } from '@/features/geo/latlng'
import type { Coordinate } from '@/features/geo/types'
import { appendVertex, closeRing } from './ring'

const a: Coordinate = { latitude: -0.2, longitude: -78.5 }
const b: Coordinate = { latitude: -0.2, longitude: -78.4 }
const c: Coordinate = { latitude: -0.1, longitude: -78.4 }

describe('appendVertex', () => {
  it('agrega vértices en orden sin mutar el trazo original', () => {
    const start = [a]
    const next = appendVertex(start, b)
    expect(next).toEqual([a, b])
    expect(start).toEqual([a])
  })

  it('ignora un clic repetido sobre el último vértice', () => {
    expect(appendVertex([a, b], b)).toEqual([a, b])
  })
})

describe('closeRing', () => {
  it('no cierra con menos de tres vértices', () => {
    expect(closeRing([])).toBeNull()
    expect(closeRing([a, b])).toBeNull()
  })

  it('repite el primer punto al final, como exige zones.v1', () => {
    const ring = closeRing([a, b, c])
    expect(ring).toEqual([a, b, c, a])
    expect(ring?.[0]).toEqual(ring?.[ring.length - 1])
  })

  it('no altera el arreglo de entrada', () => {
    const points = [a, b, c]
    closeRing(points)
    expect(points).toHaveLength(3)
  })
})

describe('toLatLngTuples', () => {
  it('convierte a [lat, lng] para Leaflet', () => {
    expect(toLatLngTuples([a])).toEqual([[-0.2, -78.5]])
  })
})
