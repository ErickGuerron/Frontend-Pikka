import { useEffect, useMemo, useRef, useState } from 'react'
import { useDialog } from '@/shared/ui/dialog'
import { LazyMapCanvas } from './LazyMapCanvas'
import type { MapZone } from './MapCanvas'
import { PlaceSearch } from './PlaceSearch'
import type { Place } from './photon'
import type { Coordinate } from './types'

const NO_ADDRESS_HINT = 'Sin dirección disponible para este punto. Puedes escribir el nombre igualmente.'

export interface ExpandedMapDialogProps {
  /** Lugar elegido hasta ahora; el mapa se centra en él al abrir. */
  value: Place | null
  zones: readonly MapZone[]
  highlight: readonly Coordinate[] | null
  highlightHoles: readonly (readonly Coordinate[])[]
  fitBounds: readonly Coordinate[] | null
  depot: Coordinate | null
  depotName: string | null
  depotDistanceLabel: string | null
  /** La dirección del punto elegido todavía se está buscando. */
  addressPending: boolean
  /** Clic en el mapa. */
  onPick: (point: Coordinate) => void
  /** Resultado elegido en el buscador. */
  onSearchPick: (place: Place) => void
  onClose: () => void
}

/**
 * Mapa a pantalla casi completa, el mismo que el del formulario (mismas zonas, mismo clic para elegir
 * punto y mismo buscador) pero con espacio para ubicar el punto con precisión. La selección vive en
 * el formulario: aquí solo se cambia y se cierra con "Listo".
 */
export function ExpandedMapDialog({
  value,
  zones,
  highlight,
  highlightHoles,
  fitBounds,
  depot,
  depotName,
  depotDistanceLabel,
  addressPending,
  onPick,
  onSearchPick,
  onClose,
}: ExpandedMapDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef<HTMLButtonElement>(null)
  const initial = useMemo(
    () => (value === null ? null : { latitude: value.latitude, longitude: value.longitude }),
    // Solo cuenta el punto con el que se abre: los clics posteriores no deben recentrar el mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const [focus, setFocus] = useState<Coordinate | null>(initial)

  // locked: el Escape lo atiende el listener de abajo, que corre antes que el del formulario contenedor.
  useDialog(dialogRef, doneRef, onClose, true)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // Fase de captura: cierra solo este diálogo; el formulario de abajo también escucha Escape.
      event.stopImmediatePropagation()
      event.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('keydown', onKey, true) }
  }, [onClose])

  const pickFromSearch = (place: Place) => {
    setFocus({ latitude: place.latitude, longitude: place.longitude })
    onSearchPick(place)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-on-background/60 p-2 sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expanded-map-title"
        className="flex max-h-full w-full max-w-6xl flex-col gap-3 overflow-y-auto rounded-2xl bg-surface-container-lowest p-4 shadow-2xl sm:p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="expanded-map-title" className="text-lg font-bold tracking-tight text-on-surface">
            Mapa ampliado
          </h2>
          <button
            aria-label="Cerrar mapa ampliado"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="text-[11px] text-on-surface-variant">
          Busca una calle o haz clic en el mapa para elegir el punto de entrega. Las zonas en verde son las que cubrimos.
        </p>
        <PlaceSearch onSelect={pickFromSearch} variant="inline" />

        <LazyMapCanvas
          className="z-0 h-[70vh] w-full rounded-xl"
          zones={zones}
          picked={value === null ? null : { latitude: value.latitude, longitude: value.longitude }}
          highlight={highlight}
          highlightHoles={highlightHoles}
          focus={focus}
          fitBounds={fitBounds}
          depot={depot}
          depotName={depotName}
          depotDistanceLabel={depotDistanceLabel}
          onMapClick={onPick}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[12px]">
            {value === null ? (
              <p className="text-on-surface-variant">Aún no elegiste un punto.</p>
            ) : (
              <>
                <p className="text-on-surface">{addressPending ? 'Buscando dirección…' : value.address || NO_ADDRESS_HINT}</p>
                <p className="text-[10px] text-on-surface-variant">
                  {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
                </p>
              </>
            )}
          </div>
          <button
            ref={doneRef}
            className="cursor-pointer rounded-xl bg-primary-container px-5 py-2.5 text-sm font-semibold text-on-primary shadow-md transition-all hover:bg-primary active:scale-[0.98]"
            onClick={onClose}
            type="button"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}
