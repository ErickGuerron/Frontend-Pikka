import { describe, expect, it } from 'vitest'
import type { Coordinate } from '@/features/geo/types'
import { isConvexPolygon, zoneShapeError } from './geometry'

const pt = (latitude: number, longitude: number): Coordinate => ({ latitude, longitude })

const square = [pt(0, 0), pt(0, 4), pt(4, 4), pt(4, 0)]
const trapezoid = [pt(0, 0), pt(0, 4), pt(1, 3), pt(1, 1)]
const triangle = [pt(0, 0), pt(0, 4), pt(3, 0)]
const dart = [pt(0, 0), pt(2, 4), pt(4, 0), pt(2, 1)]
const bowTie = [pt(0, 0), pt(2, 2), pt(2, 0), pt(0, 2)]
// Pentagrama: giros del mismo lado, pero dos vueltas completas.
const pentagram = [pt(1, 0), pt(-0.809, 0.588), pt(0.309, -0.951), pt(0.309, 0.951), pt(-0.809, -0.588)]
const flatVertex = [pt(0, 0), pt(0, 2), pt(0, 4), pt(4, 4), pt(4, 0)]

describe('isConvexPolygon', () => {
  it.each([
    ['cuadrado', square],
    ['trapecio', trapezoid],
  ])('acepta un %s en cualquier orientación', (_name, vertices) => {
    expect(isConvexPolygon(vertices)).toBe(true)
    expect(isConvexPolygon([...vertices].reverse())).toBe(true)
  })

  it.each([
    ['dardo con muesca', dart],
    ['lados cruzados', bowTie],
    ['estrella', pentagram],
    ['vértice plano', flatVertex],
  ])('rechaza un %s', (_name, vertices) => {
    expect(isConvexPolygon(vertices)).toBe(false)
  })
})

describe('zoneShapeError', () => {
  it('pide al menos cuatro vértices', () => {
    expect(zoneShapeError(triangle)).toMatch(/al menos 4 vértices/)
  })

  it('explica por qué una figura irregular no es zona', () => {
    expect(zoneShapeError(dart)).toMatch(/convexa/)
  })

  it('no reporta error para un trapecio o un cuadrado', () => {
    expect(zoneShapeError(trapezoid)).toBeNull()
    expect(zoneShapeError(square)).toBeNull()
  })
})
