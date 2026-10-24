import { filterStops, pageStops } from '../src/features/driver-route/stop-list'
import type { RouteStop } from '../src/features/driver-route/types'

const stop = (id: string, address: string, sequence = 1): RouteStop => ({
  id,
  sequence,
  address,
  windowStart: '10:00',
  windowEnd: '12:00',
  status: 'PENDING',
  reason: null,
})

const many = Array.from({ length: 7 }, (_, i) => stop(`s${String(i + 1)}`, `Calle ${String(i + 1)}`, i + 1))

describe('filterStops', () => {
  const stops = [stop('a', 'Calle Larga 5'), stop('b', 'Av. Amazonas 100'), stop('c', 'Río Coca 12')]

  it('sin texto devuelve todas las paradas', () => {
    expect(filterStops(stops, '   ')).toHaveLength(3)
  })

  it('busca sin distinguir mayusculas ni acentos', () => {
    expect(filterStops(stops, 'calle').map((s) => s.id)).toEqual(['a'])
    expect(filterStops(stops, 'AMAZONAS').map((s) => s.id)).toEqual(['b'])
    expect(filterStops(stops, 'rio coca').map((s) => s.id)).toEqual(['c'])
  })

  it('sin coincidencias devuelve lista vacia', () => {
    expect(filterStops(stops, 'xyz')).toEqual([])
  })
})

describe('pageStops', () => {
  it('muestra 5 por pagina y calcula las paginas', () => {
    const view = pageStops(many, '', 0)
    expect(view.items.map((s) => s.id)).toEqual(['s1', 's2', 's3', 's4', 's5'])
    expect(view.pages).toBe(2)
    expect(view.total).toBe(7)
  })

  it('la segunda pagina trae el resto', () => {
    const view = pageStops(many, '', 1)
    expect(view.items.map((s) => s.id)).toEqual(['s6', 's7'])
    expect(view.page).toBe(1)
  })

  it('una pagina fuera de rango se acota a la ultima', () => {
    expect(pageStops(many, '', 9).page).toBe(1)
  })

  it('la busqueda pagina solo lo que coincide', () => {
    const view = pageStops(many, 'calle 6', 0)
    expect(view.total).toBe(1)
    expect(view.items.map((s) => s.id)).toEqual(['s6'])
    expect(view.pages).toBe(1)
  })

  it('una lista vacia tiene una pagina vacia', () => {
    const view = pageStops([], '', 0)
    expect(view).toEqual({ items: [], page: 0, pages: 1, total: 0 })
  })
})
