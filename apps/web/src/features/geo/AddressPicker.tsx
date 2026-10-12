import { useEffect, useRef, useState } from 'react'
import { Field, fieldLabelClass, inputClass } from '@/shared/ui/form'
import { reversePlace } from './api'
import { LazyMapCanvas } from './LazyMapCanvas'
import { PlaceSearch } from './PlaceSearch'
import type { Place } from './photon'
import type { Coordinate } from './types'

const NO_ADDRESS_HINT = 'Sin dirección disponible para este punto. Puedes escribir el nombre igualmente.'

export interface AddressPickerProps {
  /** Lugar seleccionado, o null si no hay selección. Es un componente controlado. */
  value: Place | null
  onChange: (place: Place | null) => void
  /** Polígono a resaltar, por ejemplo la zona que contiene el punto. */
  highlight?: readonly Coordinate[] | null
  /** Huecos de la zona resaltada (dona). */
  highlightHoles?: readonly (readonly Coordinate[])[]
  /** Puntos que el mapa debe mostrar completos; cada arreglo nuevo vuelve a encuadrar. */
  fitBounds?: readonly Coordinate[] | null
  /** Bodega de salida a mostrar en el mapa, con su nombre y la distancia al punto elegido. */
  depot?: Coordinate | null
  depotName?: string | null
  depotDistanceLabel?: string | null
  /** Clases del contenedor raíz, para que el padre le dé altura (por ejemplo, un área de trabajo fija). */
  className?: string
  /** Clases del mapa. Por defecto, 420 px de alto. */
  mapClassName?: string
}

/**
 * Ingreso de dirección con mapa: búsqueda de calles y lugares, clic para elegir un
 * punto, y nombre editable. Reutilizable en cualquier formulario que necesite una
 * ubicación (zonas hoy; pedidos cuando el contrato acepte coordenadas).
 */
export function AddressPicker({
  value,
  onChange,
  highlight = null,
  highlightHoles = [],
  fitBounds = null,
  depot = null,
  depotName = null,
  depotDistanceLabel = null,
  className = '',
  mapClassName = 'h-[420px] w-full rounded-xl z-0',
}: AddressPickerProps) {
  const [focus, setFocus] = useState<Coordinate | null>(null)
  const [addressPending, setAddressPending] = useState(false)
  const lookup = useRef<AbortController | null>(null)

  // Una búsqueda de dirección pendiente no debe llegar después de desmontar el componente.
  useEffect(() => () => { lookup.current?.abort() }, [])

  const select = (place: Place | null) => {
    lookup.current?.abort()
    setAddressPending(false)
    onChange(place)
  }

  /** Clic en el mapa: el punto elegido es la fuente de verdad; la dirección llega después. */
  const pickPoint = (point: Coordinate) => {
    lookup.current?.abort()
    const controller = new AbortController()
    lookup.current = controller
    onChange(placeAt(point))
    setAddressPending(true)
    reversePlace(point.latitude, point.longitude, controller.signal)
      .then((found) => {
        if (controller.signal.aborted) return
        // Photon puede devolver un lugar cercano; conservamos las coordenadas exactas del clic.
        onChange(found === null ? placeAt(point) : { ...found, latitude: point.latitude, longitude: point.longitude })
        setAddressPending(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) setAddressPending(false)
      })
  }

  const pickFromSearch = (found: Place) => {
    setFocus({ latitude: found.latitude, longitude: found.longitude })
    select(found)
  }

  const clear = () => {
    setFocus(null)
    select(null)
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <PlaceSearch onSelect={pickFromSearch} variant="inline" />
      <LazyMapCanvas
        className={mapClassName}
        picked={value === null ? null : { latitude: value.latitude, longitude: value.longitude }}
        highlight={highlight}
        highlightHoles={highlightHoles}
        focus={focus}
        fitBounds={fitBounds}
        depot={depot}
        depotName={depotName}
        depotDistanceLabel={depotDistanceLabel}
        onMapClick={pickPoint}
      />

      {value !== null && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-[12px]">
          <Field label="Nombre del lugar">
            <input
              aria-label="Nombre del lugar"
              className={inputClass}
              maxLength={120}
              onChange={(e) => { onChange({ ...value, name: e.target.value }); }}
              placeholder="Ej. Casa de la esquina"
              value={value.name}
            />
          </Field>
          <div className="flex flex-col gap-1">
            <span className={fieldLabelClass}>Dirección</span>
            <p className="text-on-surface">{addressPending ? 'Buscando dirección…' : value.address || NO_ADDRESS_HINT}</p>
            <p className="text-[10px] text-on-surface-variant">
              {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
            </p>
          </div>
          <div>
            <button
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container cursor-pointer"
              onClick={clear}
              type="button"
            >
              Quitar selección
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

/** Lugar sin nombre ni dirección en el punto indicado. */
function placeAt(point: Coordinate): Place {
  return { name: '', address: '', latitude: point.latitude, longitude: point.longitude }
}
