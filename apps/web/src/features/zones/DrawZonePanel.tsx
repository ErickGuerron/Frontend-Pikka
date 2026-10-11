import { useMutation } from '@tanstack/react-query'
import { useEffect, useState, type SyntheticEvent } from 'react'
import { LazyMapCanvas } from '@/features/geo/LazyMapCanvas'
import { PlaceSearch } from '@/features/geo/PlaceSearch'
import type { Coordinate } from '@/features/geo/types'
import { userMessage } from '@/shared/api/errors'
import { ErrorMessage, Field, inputClass } from '@/shared/ui/form'
import { createZone } from './api'
import { holeFitError, MIN_ZONE_VERTICES, zoneShapeError } from './geometry'
import { addPoint, closeRing, removeLastVertex, removePoint, zoneVertices } from './ring'
import type { Zone } from './types'

/** Qué anillo se está trazando: el exterior de la zona o un hueco (dona). */
type Editing = 'outer' | 'hole'

/**
 * Dibujo de una zona (solo ADMIN). Se traza el exterior y, opcionalmente, huecos
 * dentro de él. La forma de cada anillo se calcula a partir de sus puntos marcados.
 */
export function DrawZonePanel() {
  const [outerPoints, setOuterPoints] = useState<Coordinate[]>([])
  const [holePoints, setHolePoints] = useState<Coordinate[]>([])
  const [holes, setHoles] = useState<Coordinate[][]>([])
  const [editing, setEditing] = useState<Editing>('outer')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [saved, setSaved] = useState<Zone | null>(null)
  // Búsqueda de calle o lugar: solo centra el mapa, nunca marca un punto.
  const [focusPoint, setFocusPoint] = useState<Coordinate | null>(null)

  const outerVertices = zoneVertices(outerPoints)
  const outerShapeError = zoneShapeError(outerVertices)
  const outerRing = outerShapeError === null ? closeRing(outerVertices) : null

  const holeVertices = zoneVertices(holePoints)
  const holeError = editing === 'hole' && holePoints.length > 0 ? holeFitError(holeVertices, outerVertices, holes) : null
  const holeReady = editing === 'hole' && holeVertices.length >= MIN_ZONE_VERTICES && holeError === null

  // Los puntos del anillo en edición: un clic, quitar o deshacer siempre actúan sobre él.
  const activePoints = editing === 'outer' ? outerPoints : holePoints
  const updateActive = (update: (current: Coordinate[]) => Coordinate[]) => {
    if (editing === 'outer') setOuterPoints(update)
    else setHolePoints(update)
  }
  const activeVertices = editing === 'outer' ? outerVertices : holeVertices

  const save = useMutation({
    mutationFn: createZone,
    onSuccess: (created) => {
      setSaved(created)
      setOuterPoints([])
      setHolePoints([])
      setHoles([])
      setEditing('outer')
      setCode('')
      setName('')
    },
  })

  const onMapClick = (point: Coordinate) => {
    setSaved(null)
    updateActive((current) => addPoint(current, point))
  }

  // Atajos: Retroceso o Supr quitan el último vértice y Esc limpia el anillo en edición.
  // No se activan mientras el usuario escribe en un campo, para no borrar el código de la zona.
  useEffect(() => {
    const setActive = editing === 'outer' ? setOuterPoints : setHolePoints
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        setActive((current) => removeLastVertex(current))
      } else if (event.key === 'Escape') {
        setActive(() => [])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown); }
  }, [editing])

  const startHole = () => {
    setEditing('hole')
    setHolePoints([])
  }

  const finishHole = () => {
    if (!holeReady) return
    setHoles((current) => [...current, holeVertices])
    setHolePoints([])
    setEditing('outer')
  }

  const cancelHole = () => {
    setHolePoints([])
    setEditing('outer')
  }

  const removeHole = (index: number) => {
    setHoles((current) => current.filter((_, i) => i !== index))
  }

  const canSave = editing === 'outer' && outerRing !== null && code.trim() !== '' && name.trim() !== '' && !save.isPending
  const activeError = editing === 'outer' ? outerShapeError : holeError

  const onSave = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (outerRing === null || !canSave) return
    const closedHoles = holes.map((hole) => closeRing(hole)).filter((hole): hole is Coordinate[] => hole !== null)
    save.mutate({ code: code.trim(), name: name.trim(), ring: outerRing, holes: closedHoles })
  }

  return (
    <>
      <section className="relative bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 p-2">
        <PlaceSearch onSelect={(place) => { setFocusPoint({ latitude: place.latitude, longitude: place.longitude }); }} />
        <LazyMapCanvas
          drawing={activeVertices}
          reference={editing === 'hole' ? outerVertices : null}
          holes={holes}
          focus={focusPoint}
          onMapClick={onMapClick}
          onVertexRemove={(vertex) => { updateActive((current) => removePoint(current, vertex)); }}
        />
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-surface-container-high/60 p-3">
        <div className="flex flex-col gap-1 mb-2 text-[12px] text-on-surface">
          <p>
            {editing === 'outer' ? 'Exterior' : 'Hueco'} · Vértices: <span className="font-bold">{activeVertices.length}</span>
            {activeVertices.length < MIN_ZONE_VERTICES && <span className="text-on-surface-variant"> (mínimo {MIN_ZONE_VERTICES})</span>}
            <span className="text-on-surface-variant"> · Huecos: {holes.length}</span>
          </p>
          <p className="text-[10px] text-on-surface-variant">
            Busca una calle o lugar para ubicar el mapa (la búsqueda no marca puntos). Clic: marcar un punto · Clic derecho sobre un vértice o Retroceso: quitar el último · Esc: limpiar.
          </p>
          {activePoints.length > 0 && activeError !== null && <p className="text-[11px] text-on-surface-variant">{activeError}</p>}
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {editing === 'outer' ? (
            <button
              className="px-3 py-1.5 rounded-lg border border-surface-container-high text-[11px] font-semibold text-on-surface disabled:opacity-50 cursor-pointer"
              disabled={outerShapeError !== null}
              onClick={startHole}
              type="button"
            >
              Agregar hueco
            </button>
          ) : (
            <>
              <button
                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                disabled={!holeReady}
                onClick={finishHole}
                type="button"
              >
                Terminar hueco
              </button>
              <button
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                onClick={cancelHole}
                type="button"
              >
                Cancelar hueco
              </button>
            </>
          )}
        </div>

        {holes.length > 0 && editing === 'outer' && (
          <ul className="flex flex-col gap-1 mb-3 text-[11px] text-on-surface">
            {holes.map((hole, i) => (
              <li key={`hole-${String(i)}`} className="flex items-center justify-between gap-2">
                <span>Hueco {i + 1} · {hole.length} vértices</span>
                <button className="text-[11px] font-semibold underline cursor-pointer" onClick={() => { removeHole(i); }} type="button">
                  Quitar hueco {i + 1}
                </button>
              </li>
            ))}
          </ul>
        )}

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
              onClick={() => { updateActive(() => []); }}
              type="button"
            >
              Limpiar trazo
            </button>
            <button
              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-semibold cursor-pointer disabled:opacity-50"
              disabled={!canSave}
              type="submit"
            >
              {save.isPending ? 'Guardando…' : 'Guardar zona'}
            </button>
          </div>
        </form>
        {save.isError && <ErrorMessage className="mt-2">No se pudo guardar la zona. {userMessage(save.error)}</ErrorMessage>}
        {saved !== null && <p role="status" className="mt-2 text-[11px] text-on-surface">Zona {saved.code} guardada.</p>}
      </section>
    </>
  )
}

/** Campos de texto: ahí las teclas escriben y no editan el trazo. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}
