import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { searchPlaces } from './api'
import type { Place } from './photon'

const MIN_QUERY_LENGTH = 3
const DEBOUNCE_MS = 400

export interface PlaceSearchProps {
  onSelect: (place: Place) => void
  /**
   * overlay: flota sobre el mapa (por defecto). inline: ocupa su lugar en el flujo, sin tapar
   * controles ni el mapa; úsalo cuando el buscador va encima de un mapa en un formulario.
   */
  variant?: 'overlay' | 'inline'
}

/** Buscador de calles y lugares con Photon. */
export function PlaceSearch({ onSelect, variant = 'overlay' }: PlaceSearchProps) {
  const [text, setText] = useState('')
  const query = useDebounced(text.trim(), DEBOUNCE_MS)
  const searchable = query.length >= MIN_QUERY_LENGTH && query === text.trim()

  const results = useQuery({
    queryKey: ['geo', 'search', query],
    queryFn: ({ signal }) => searchPlaces(query, signal),
    enabled: searchable,
    retry: false,
    staleTime: 5 * 60_000,
  })

  const choose = (place: Place) => {
    setText('')
    onSelect(place)
  }

  return (
    <div className={variant === 'inline' ? 'relative w-full' : 'absolute top-3 left-14 z-[1000] w-72 max-w-[calc(100%-4rem)]'}>
      <label className="group flex items-center gap-2 rounded-xl border-2 border-primary/25 bg-surface-container-lowest px-3 shadow-md transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
        <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-primary">search</span>
        <input
          aria-label="Buscar calle o lugar"
          className="h-11 min-w-0 flex-1 bg-transparent text-[13px] text-on-surface placeholder:text-on-surface-variant focus:outline-none"
          onChange={(e) => { setText(e.target.value); }}
          placeholder="Buscar calle, lugar o barrio…"
          type="text"
          value={text}
        />
        {text !== '' && (
          <button
            aria-label="Limpiar búsqueda"
            className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container cursor-pointer"
            onClick={() => { setText(''); }}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </label>
      {text.trim().length > 0 && text.trim().length < MIN_QUERY_LENGTH && (
        <p className="mt-1 rounded-lg bg-surface-container-lowest/95 px-3 py-1.5 text-[11px] text-on-surface-variant shadow">
          Escribe al menos {MIN_QUERY_LENGTH} letras.
        </p>
      )}
      {searchable && results.isPending && (
        <p className="mt-1 rounded-lg bg-surface-container-lowest/95 px-3 py-1.5 text-[11px] text-on-surface-variant shadow">Buscando…</p>
      )}
      {searchable && results.isError && (
        <p role="alert" className="mt-1 rounded-lg bg-error-container px-3 py-1.5 text-[11px] text-on-error-container shadow">
          No se pudo buscar en este momento. Intenta de nuevo.
        </p>
      )}
      {searchable && results.isSuccess && results.data.length === 0 && (
        <p className="mt-1 rounded-lg bg-surface-container-lowest/95 px-3 py-1.5 text-[11px] text-on-surface-variant shadow">Sin resultados.</p>
      )}
      {searchable && results.isSuccess && results.data.length > 0 && (
        <ul className="mt-1 overflow-hidden rounded-lg border border-surface-container-high bg-surface-container-lowest shadow-md">
          {results.data.map((place) => (
            <li key={`${String(place.latitude)},${String(place.longitude)},${place.name}`}>
              <button
                className="w-full px-3 py-2 text-left hover:bg-surface-container-low cursor-pointer"
                onClick={() => { choose(place); }}
                type="button"
              >
                <span className="block text-[12px] font-semibold text-on-surface">{place.name}</span>
                {place.address !== '' && <span className="block text-[11px] text-on-surface-variant">{place.address}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Devuelve el valor solo cuando deja de cambiar durante `delay` ms. */
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => { setDebounced(value); }, delay)
    return () => { clearTimeout(id); }
  }, [value, delay])
  return debounced
}
