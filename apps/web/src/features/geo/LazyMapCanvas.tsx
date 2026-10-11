import { lazy, Suspense } from 'react'
import type { MapCanvasProps } from './MapCanvas'

// Leaflet (~150 kB) se descarga solo cuando una pantalla muestra el mapa.
const MapCanvas = lazy(() => import('./MapCanvas').then((m) => ({ default: m.MapCanvas })))

/** Mapa con carga diferida y mensaje mientras llega el código. */
export function LazyMapCanvas(props: MapCanvasProps) {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-center text-[11px] text-on-surface-variant">Cargando mapa…</p>}>
      <MapCanvas {...props} />
    </Suspense>
  )
}
