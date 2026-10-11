import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState, type SyntheticEvent } from 'react'
import { useCurrentUser } from '@/features/auth/hooks'
import { AddressPicker } from '@/features/geo/AddressPicker'
import { LazyMapCanvas } from '@/features/geo/LazyMapCanvas'
import { PlaceSearch } from '@/features/geo/PlaceSearch'
import type { Place } from '@/features/geo/photon'
import type { Coordinate } from '@/features/geo/types'
import { ApiError, userMessage } from '@/shared/api/errors'
import { ErrorMessage, Field, inputClass } from '@/shared/ui/form'
import { classifyPoint, createZone } from './api'
import { zoneShapeError } from './geometry'
import { addPoint, closeRing, removeLastVertex, removePoint, zoneVertices } from './ring'
import type { Zone } from './types'

type Mode = 'classify' | 'draw'

export function ZonesPage() {
  const { data: user } = useCurrentUser()
  const canDraw = user?.role === 'ADMIN'
  const [mode, setMode] = useState<Mode>('classify')
  const effectiveMode: Mode = canDraw ? mode : 'classify'

  // Clasificación: el lugar elegido con el AddressPicker.
  const [place, setPlace] = useState<Place | null>(null)
  const classifyTarget: Coordinate | null =
    effectiveMode === 'classify' && place !== null ? { latitude: place.latitude, longitude: place.longitude } : null

  // La clave incluye el punto: una respuesta tardía de un punto anterior nunca
  // reemplaza la clasificación del punto actual.
  const classification = useQuery({
    queryKey: ['zones', 'classify', classifyTarget?.latitude ?? null, classifyTarget?.longitude ?? null],
    queryFn: ({ signal }) => (classifyTarget === null ? Promise.reject(new Error('sin punto')) : classifyPoint(classifyTarget, signal)),
    enabled: classifyTarget !== null,
    retry: false,
  })
  const zone: Zone | null = classification.data ?? null
  const outside = classification.error instanceof ApiError && classification.error.status === 404
  const classifyFailed = classification.isError && !outside

  // Dibujo de zonas (solo ADMIN). Se guardan los puntos marcados; la forma se calcula a partir de ellos.
  const [points, setPoints] = useState<Coordinate[]>([])
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [saved, setSaved] = useState<Zone | null>(null)
  // Búsqueda de calle o lugar: solo centra el mapa, nunca marca un punto.
  const [focusPoint, setFocusPoint] = useState<Coordinate | null>(null)

  const vertices = zoneVertices(points)
  const shapeError = zoneShapeError(vertices)
  const ring = shapeError === null ? closeRing(vertices) : null

  const save = useMutation({
    mutationFn: createZone,
    onSuccess: (created) => {
      setSaved(created)
      setPoints([])
      setCode('')
      setName('')
    },
  })

  const onDrawClick = (point: Coordinate) => {
    setSaved(null)
    setPoints((current) => addPoint(current, point))
  }

  const removeDrawVertex = (vertex: Coordinate) => {
    setPoints((current) => removePoint(current, vertex))
  }

  const clearDrawing = () => {
    setPoints([])
  }

  // Atajos de teclado para dibujar: Retroceso o Supr quitan el último punto y Esc limpia el trazo.
  // No se activan mientras el usuario escribe en un campo, para no borrar el código de la zona.
  useEffect(() => {
    if (effectiveMode !== 'draw') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        setPoints((current) => removeLastVertex(current))
      } else if (event.key === 'Escape') {
        setPoints([])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown); }
  }, [effectiveMode])

  const onSave = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (ring === null) return
    save.mutate({ code: code.trim(), name: name.trim(), ring })
  }

  const canSubmit = ring !== null && code.trim() !== '' && name.trim() !== '' && !save.isPending

  return (
    <div className="flex flex-col gap-2 pt-2 pb-6">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-on-surface tracking-tight">Zonas</h1>
          <span className="uppercase tracking-wider text-primary bg-primary-fixed/60 px-2 py-0.5 rounded-full font-bold text-[9px]">
            Mapa
          </span>
        </div>
        <p className="text-[11px] text-on-surface-variant leading-tight">
          {effectiveMode === 'classify'
            ? 'Busca una calle o haz clic en el mapa para ver su dirección y a qué zona pertenece.'
            : 'Marca los puntos de la zona. La figura se ajusta sola para formar un trapecio o cuadrado convexo.'}
        </p>
      </div>

      {canDraw && (
        <div role="group" aria-label="Modo del mapa" className="inline-flex self-start rounded-lg border border-surface-container-high p-0.5 bg-surface-container-low">
          <ModeButton active={effectiveMode === 'classify'} onClick={() => { setMode('classify'); }}>Clasificar punto</ModeButton>
          <ModeButton active={effectiveMode === 'draw'} onClick={() => { setMode('draw'); }}>Dibujar zona</ModeButton>
        </div>
      )}

      {effectiveMode === 'classify' ? (
        <section className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 p-2 flex flex-col gap-2">
          <AddressPicker value={place} onChange={setPlace} highlight={zone?.ring ?? null} />
          {classifyTarget !== null && (
            <div aria-live="polite" className="flex flex-col gap-1 px-1 pb-1 text-[12px] text-on-surface">
              {outside && <p>Ninguna zona cubre este punto.</p>}
              {zone !== null && (
                <p>
                  Zona <span className="font-bold">{zone.name}</span> ({zone.code}).
                </p>
              )}
              {classification.isPending && <p className="text-on-surface-variant">Clasificando…</p>}
              {classifyFailed && <ErrorMessage className="text-[12px]">No pudimos clasificar el punto. {userMessage(classification.error)}</ErrorMessage>}
            </div>
          )}
        </section>
      ) : (
        <section className="relative bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 p-2">
          <PlaceSearch onSelect={(place) => { setFocusPoint({ latitude: place.latitude, longitude: place.longitude }); }} />
          <LazyMapCanvas drawing={vertices} focus={focusPoint} onMapClick={onDrawClick} onVertexRemove={removeDrawVertex} />
        </section>
      )}

      {effectiveMode === 'draw' && (
        <section className="bg-surface-container-lowest rounded-xl border border-surface-container-high/60 p-3">
          <div className="flex flex-col gap-1 mb-2 text-[12px] text-on-surface">
            <p>
              Vértices: <span className="font-bold">{vertices.length}</span>
              {vertices.length < 4 && <span className="text-on-surface-variant"> (mínimo 4)</span>}
            </p>
            <p className="text-[10px] text-on-surface-variant">
              Busca una calle o lugar para ubicar el mapa (la búsqueda no marca puntos). Clic: marcar un punto · Clic derecho sobre un vértice o Retroceso: quitar el último · Esc: limpiar.
            </p>
            {points.length > 0 && shapeError !== null && <p className="text-[11px] text-on-surface-variant">{shapeError}</p>}
          </div>
          <form className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-end" onSubmit={onSave}>
            <Field label="Código">
              <input className={inputClass} maxLength={32} onChange={(e) => { setCode(e.target.value); }} value={code} />
            </Field>
            <Field label="Nombre">
              <input className={inputClass} maxLength={120} onChange={(e) => { setName(e.target.value); }} value={name} />
            </Field>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                onClick={clearDrawing}
                type="button"
              >
                Limpiar trazo
              </button>
              <button
                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                disabled={!canSubmit}
                type="submit"
              >
                {save.isPending ? 'Guardando…' : 'Guardar zona'}
              </button>
            </div>
          </form>
          {save.isError && <ErrorMessage className="mt-2">No se pudo guardar la zona. {userMessage(save.error)}</ErrorMessage>}
          {saved !== null && <p role="status" className="mt-2 text-[11px] text-on-surface">Zona {saved.code} guardada.</p>}
        </section>
      )}
    </div>
  )
}

/** Campos de texto: ahí las teclas escriben y no editan el trazo. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer ${active ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
