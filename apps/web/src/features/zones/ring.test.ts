import { describe, expect, it } from 'vitest'
import { toLatLngTuples } from '@/features/geo/latlng'
import type { Coordinate } from '@/features/geo/types'
import { addVertex, closeRing, removeVertex, VERTEX_REJECTED_MESSAGE } from './ring'

const a: Coordinate = { latitude: -0.2, longitude: -78.5 }
const b: Coordinate = { latitude: -0.2, longitude: -78.4 }
const c: Coordinate = { latitude: -0.1, longitude: -78.4 }
const d: Coordinate = { latitude: -0.1, longitude: -78.5 }
// Dentro del cuadrado: al añadirlo, deja una muesca.
const inside: Coordinate = { latitude: -0.15, longitude: -78.45 }

describe('addVertex', () => {
  it('agrega vértices en orden sin mutar el trazo original', () => {
    const start = [a, b]
    const result = addVertex(start, c)
    expect(result).toEqual({ points: [a, b, c], error: null })
    expect(start).toEqual([a, b])
  })

  it('ignora un clic repetido sobre el último vértice, sin error', () => {
    expect(addVertex([a, b], b)).toEqual({ points: [a, b], error: null })
  })

  it('rechaza un vértice que deja la figura no convexa y conserva el trazo', () => {
    const square = [a, b, c, d]
    expect(addVertex(square, inside)).toEqual({ points: square, error: VERTEX_REJECTED_MESSAGE })
  })

  it('vuelve a colocar un vértice quitado en su posición original', () => {
    const removed = removeVertex([a, b, c, d], 1)
    expect(addVertex(removed, b)).toEqual({ points: [a, b, c, d], error: null })
  })

  it('coloca un vértice nuevo en la arista que lo recibe, no al final', () => {
    // Triángulo a, b, c: el punto d solo cabe entre c y a.
    expect(addVertex([a, b, c], d)).toEqual({ points: [a, b, c, d], error: null })
  })

  it('rechaza un punto que no cabe en ninguna arista sin romper la forma', () => {
    const square = [a, b, c, d]
    expect(addVertex(square, inside).error).toBe(VERTEX_REJECTED_MESSAGE)
  })

  it('rechaza un tercer punto alineado: no forma una esquina', () => {
    const mid: Coordinate = { latitude: -0.2, longitude: -78.45 }
    expect(addVertex([a, mid], b).error).toBe(VERTEX_REJECTED_MESSAGE)
  })
})

describe('removeVertex', () => {
  it('quita el vértice indicado sin mutar el arreglo original', () => {
    const square = [a, b, c, d]
    expect(removeVertex(square, 1)).toEqual([a, c, d])
    expect(square).toHaveLength(4)
  })

  it('ignora un índice fuera de rango', () => {
    expect(removeVertex([a, b], 5)).toEqual([a, b])
  })
})

describe('closeRing', () => {
  it('no cierra con menos de cuatro vértices', () => {
    expect(closeRing([])).toBeNull()
    expect(closeRing([a, b, c])).toBeNull()
  })

  it('repite el primer punto al final, como exige zones.v1', () => {
    const ring = closeRing([a, b, c, d])
    expect(ring).toEqual([a, b, c, d, a])
    expect(ring?.[0]).toEqual(ring?.[ring.length - 1])
  })

  it('no altera el arreglo de entrada', () => {
    const points = [a, b, c, d]
    closeRing(points)
    expect(points).toHaveLength(4)
  })
})

describe('toLatLngTuples', () => {
  it('convierte a [lat, lng] para Leaflet', () => {
    expect(toLatLngTuples([a])).toEqual([[-0.2, -78.5]])
  })
})
