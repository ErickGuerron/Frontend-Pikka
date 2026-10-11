import { describe, expect, it } from 'vitest'
import type { Coordinate } from '@/features/geo/types'
import { convexHull, isConvexPolygon, zoneShapeError } from './geometry'

const pt = (latitude: number, longitude: number): Coordinate => ({ latitude, longitude })
const keyOf = (p: Coordinate): string => JSON.stringify([p.latitude, p.longitude])

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

describe('convexHull', () => {
  it('descarta el punto interior y deja las cuatro esquinas', () => {
    const hull = convexHull([pt(0, 0), pt(0, 4), pt(4, 4), pt(4, 0), pt(2, 2)])
    expect(hull).toHaveLength(4)
    expect(hull.map(keyOf)).not.toContain(keyOf(pt(2, 2)))
  })

  it('un punto fuera de la figura la expande sin romper la convexidad', () => {
    const hull = convexHull([pt(0, 0), pt(0, 4), pt(3, 0), pt(5, 2)])
    expect(isConvexPolygon(hull)).toBe(true)
    expect(hull.map(keyOf)).toContain(keyOf(pt(5, 2)))
  })

  it('no depende del orden en que se marcan los puntos', () => {
    const points = [pt(0, 0), pt(0, 4), pt(4, 4), pt(4, 0), pt(2, 5)]
    const forward = convexHull(points).map(keyOf).sort()
    const backward = convexHull([...points].reverse()).map(keyOf).sort()
    expect(forward).toEqual(backward)
  })

  it('puntos alineados no forman figura: solo quedan los extremos', () => {
    expect(convexHull([pt(0, 0), pt(0, 2), pt(0, 4)])).toEqual([pt(0, 0), pt(0, 4)])
  })

  it('siempre devuelve un polígono convexo, sin importar dónde caigan los puntos', () => {
    // Generador determinista: 200 conjuntos de puntos dispersos, siempre los mismos.
    let seed = 42
    const next = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    for (let run = 0; run < 200; run++) {
      const points = Array.from({ length: 4 + (run % 9) }, () => pt(next() * 10, next() * 10))
      const hull = convexHull(points)
      if (hull.length >= 3) {
        expect(isConvexPolygon(hull), `corrida ${String(run)}`).toBe(true)
      }
    }
  })
})
