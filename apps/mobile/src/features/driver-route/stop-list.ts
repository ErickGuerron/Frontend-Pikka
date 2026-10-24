import { paginate } from './stop-sort'
import type { RouteStop } from './types'

/** Quita acentos y mayusculas para comparar direcciones: "Río" y "rio" coinciden. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

/** Paradas cuya direccion contiene el texto buscado. Sin texto, todas. El orden no cambia. */
export function filterStops(stops: readonly RouteStop[], query: string): RouteStop[] {
  const needle = normalize(query)
  if (needle === '') return [...stops]
  return stops.filter((stop) => normalize(stop.address).includes(needle))
}

export interface StopListPage {
  items: RouteStop[]
  /** Pagina mostrada, ya acotada al rango disponible. */
  page: number
  pages: number
  /** Paradas que coinciden con la busqueda, antes de paginar. */
  total: number
}

/** Filtra y pagina (5 por pagina, como el selector de paradas). */
export function pageStops(stops: readonly RouteStop[], query: string, page: number): StopListPage {
  const matches = filterStops(stops, query)
  return { ...paginate(matches, page), total: matches.length }
}
