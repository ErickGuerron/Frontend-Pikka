import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode, type SyntheticEvent } from 'react'
import { LazyMapCanvas } from '@/features/geo/LazyMapCanvas'
import { PlaceSearch } from '@/features/geo/PlaceSearch'
import type { Coordinate } from '@/features/geo/types'
import { userMessage } from '@/shared/api/errors'
import { ErrorMessage, Field, inputClass } from '@/shared/ui/form'
import { createZone, listZones, updateZone, type ZoneDraft } from './api'
import { codePreview } from './code'
import { holeFitError, MIN_ZONE_VERTICES, zoneShapeError } from './geometry'
import { zoneAreaKm2 } from './metrics'
import { MapToolbar, type MapTool } from './MapToolbar'
import { addPoint, closeRing, removeLastVertex, removePoint, zoneVertices } from './ring'
import { defaultSettingsForm, LIMITS, settingsFormFromZone, settingsFormIssues, settingsFromForm, zoneNameIssue, type SettingsForm } from './settings'
import { ZoneList } from './ZoneList'
import { ZoneSettingsForm } from './ZoneSettingsForm'
import { VertexListModal } from './VertexListModal'
import { ZoneTabs } from './ZoneTabs'
import type { Zone } from './types'

/** Qué anillo se está trazando: el exterior de la zona o un hueco (dona). */
type Editing = 'outer' | 'hole'

type Panel = 'list' | 'editor'

/** Geometría en edición. Es lo que el historial de deshacer restaura. */
interface Shape {
  outer: Coordinate[]
  hole: Coordinate[]
  holes: Coordinate[][]
  editing: Editing
}

/** Un paso del historial: la forma previa y, si la acción tocó la bodega, la bodega previa. */
interface HistoryEntry {
  shape: Shape
  depot: { latitude: string; longitude: string }
  depotChanged: boolean
}

const EMPTY_SHAPE: Shape = { outer: [], hole: [], holes: [], editing: 'outer' }

/** Resultado del último guardado, para confirmarlo al usuario. */
interface Saved {
  zone: Zone
  updated: boolean
}

interface SaveRequest {
  /** Identificador de la zona que se redibuja, o null si es una zona nueva. */
  id: string | null
  draft: ZoneDraft
}

/**
 * Dibujo de zonas (solo ADMIN). Se traza el exterior y, opcionalmente, huecos dentro de él.
 * Redibujar carga la zona como estado base: deshacer vuelve atrás por las acciones del usuario,
 * nunca más allá de ese estado inicial. Cancelar el redibujo sale del modo sin cambiar de pantalla.
 */
export function DrawZonePanel() {
  const queryClient = useQueryClient()
  const zonesQuery = useQuery({ queryKey: ['zones', 'list'], queryFn: listZones })

  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [shape, setShape] = useState<Shape>(EMPTY_SHAPE)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [name, setName] = useState('')
  const [settings, setSettings] = useState<SettingsForm>(defaultSettingsForm)
  const [saved, setSaved] = useState<Saved | null>(null)
  // Búsqueda de calle o lugar: solo centra el mapa, nunca marca un punto.
  const [focusPoint, setFocusPoint] = useState<Coordinate | null>(null)
  // Zona mostrada en el mapa sin editarla, y encuadre pedido. Cada arreglo nuevo vuelve a encuadrar.
  const [viewedZone, setViewedZone] = useState<Zone | null>(null)
  const [fitBounds, setFitBounds] = useState<Coordinate[] | null>(null)
  // Herramienta activa del mapa. Persiste hasta que el usuario elige otra.
  const [tool, setTool] = useState<MapTool>('add')
  // Pestaña del panel lateral: el listado de zonas o el formulario de creación/edición.
  const [panel, setPanel] = useState<Panel>('editor')
  // Listado completo de vértices del anillo en edición (modal).
  const [vertexModal, setVertexModal] = useState(false)

  const outerPoints = shape.outer
  const holePoints = shape.hole
  const { holes, editing } = shape

  const outerVertices = zoneVertices(outerPoints)
  const outerShapeError = zoneShapeError(outerVertices)
  const outerRing = outerShapeError === null ? closeRing(outerVertices) : null

  const holeVertices = zoneVertices(holePoints)
  const holeError = editing === 'hole' && holePoints.length > 0 ? holeFitError(holeVertices, outerVertices, holes) : null
  const holeReady = editing === 'hole' && holeVertices.length >= MIN_ZONE_VERTICES && holeError === null

  const activePoints = editing === 'outer' ? outerPoints : holePoints
  const activeVertices = editing === 'outer' ? outerVertices : holeVertices

  // Huecos cerrados: el mismo formato que se envía al guardar.
  const closedHoles = holes.map((hole) => closeRing(hole)).filter((hole): hole is Coordinate[] => hole !== null)
  const areaKm2 = outerRing !== null ? zoneAreaKm2(outerRing, closedHoles) : null
  const depotPoint = depotCoordinate(settings)

  /** Registra una acción del usuario en el historial y aplica la nueva forma. */
  const commit = (next: Shape, depotChange = false) => {
    setHistory((past) => [
      ...past.slice(-99),
      {
        shape,
        depot: { latitude: settings.depotLatitude, longitude: settings.depotLongitude },
        depotChanged: depotChange,
      },
    ])
    setShape(next)
  }

  /** Aplica un cambio a los puntos del anillo en edición (exterior u hueco). */
  const mapActive = (current: Shape, update: (points: Coordinate[]) => Coordinate[]): Shape =>
    current.editing === 'outer' ? { ...current, outer: update(current.outer) } : { ...current, hole: update(current.hole) }

  const updateActive = (update: (points: Coordinate[]) => Coordinate[]) => {
    commit(mapActive(shape, update))
  }

  const undo = () => {
    const last = history[history.length - 1]
    if (last === undefined) return
    setHistory((past) => past.slice(0, -1))
    setShape(last.shape)
    if (last.depotChanged) {
      setSettings((current) => ({ ...current, depotLatitude: last.depot.latitude, depotLongitude: last.depot.longitude }))
    }
  }

  const resetDraft = () => {
    setEditingZone(null)
    setShape(EMPTY_SHAPE)
    setHistory([])
    setName('')
    setSettings(defaultSettingsForm())
    setTool('add')
  }

  const save = useMutation({
    mutationFn: ({ id, draft }: SaveRequest) => (id === null ? createZone(draft) : updateZone(id, draft)),
    onSuccess: (zone, { id }) => {
      setSaved({ zone, updated: id !== null })
      resetDraft()
      void queryClient.invalidateQueries({ queryKey: ['zones'] })
    },
  })

  /** Carga una zona registrada como estado base del editor. */
  const startRedraw = (zone: Zone) => {
    setSaved(null)
    setEditingZone(zone)
    setViewedZone(null)
    setFitBounds([...zone.ring])
    setShape({
      outer: zone.ring.slice(0, -1),
      hole: [],
      holes: zone.holes.map((hole) => hole.slice(0, -1)),
      editing: 'outer',
    })
    setHistory([])
    setTool('add')
    setPanel('editor')
    setName(zone.name)
    setSettings(settingsFormFromZone(zone.settings))
  }

  /** Muestra una zona en el mapa, con su contorno, sin entrar en modo edición. */
  const viewZone = (zone: Zone) => {
    setViewedZone(zone)
    setFitBounds([...zone.ring])
  }

  const onMapClick = (point: Coordinate) => {
    setSaved(null)
    if (tool === 'depot') {
      // La bodega se fija con un clic, pero la herramienta sigue activa: el usuario puede ajustarla
      // hasta que elija otra herramienta. Cada fijación queda en el historial.
      commit(shape, true)
      setSettings((current) => ({
        ...current,
        depotLatitude: point.latitude.toFixed(6),
        depotLongitude: point.longitude.toFixed(6),
      }))
      return
    }
    if (tool === 'erase') return
    updateActive((current) => addPoint(current, point))
  }

  const startHole = () => {
    commit({ ...shape, hole: [], editing: 'hole' })
  }

  const cancelHole = () => {
    commit({ ...shape, hole: [], editing: 'outer' })
  }

  const toggleHole = () => {
    if (editing === 'hole') cancelHole()
    else startHole()
    setTool('add')
  }

  /** Elegir "agregar vértice" sale del modo exclusión sin pulsar 2 otra vez; las demás herramientas no. */
  const chooseTool = (next: MapTool) => {
    if (next === 'add' && editing === 'hole') cancelHole()
    setTool(next)
  }

  const finishHole = () => {
    if (!holeReady) return
    commit({ ...shape, holes: [...holes, holeVertices], hole: [], editing: 'outer' })
  }

  const removeHole = (index: number) => {
    commit({ ...shape, holes: holes.filter((_, i) => i !== index) })
  }

  /** Encuadra la figura en edición; útil después de moverse por el mapa o buscar otro lugar. */
  const fitActive = () => {
    if (activeVertices.length > 0) setFitBounds([...activeVertices])
  }

  // Atajos de teclado. No se activan mientras el usuario escribe en un campo.
  //   1 agregar vértice · 2 exclusión (hole) · 3 quitar vértice · 4 bodega · F encuadrar
  //   Ctrl+Z deshacer · Retroceso o Supr quitar el último vértice · Esc limpiar el anillo en edición
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      // Con el listado abierto, Escape solo lo cierra: no limpia el trazo.
      if (vertexModal) {
        if (event.key === 'Escape') setVertexModal(false)
        return
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undo()
        return
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return
      switch (event.key) {
        case '1': chooseTool('add'); break
        case '2': toggleHole(); break
        case '3': setTool('erase'); break
        case '4': setTool('depot'); break
        case 'f':
        case 'F': fitActive(); break
        case 'Backspace':
        case 'Delete':
          event.preventDefault()
          updateActive(removeLastVertex)
          break
        case 'Escape':
          if (editing === 'hole') cancelHole()
          else if (activePoints.length > 0) updateActive(() => [])
          break
        default: break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown); }
  })

  const configured = settingsFromForm(settings)
  // Todo lo que falta para guardar, en español. Vacío cuando la zona está lista.
  const missingItems = [
    name.trim() === '' ? 'Nombre de la zona (obligatorio)' : zoneNameIssue(name),
    outerRing === null
      ? outerVertices.length < MIN_ZONE_VERTICES
        ? `Perímetro: marca al menos ${String(MIN_ZONE_VERTICES)} vértices en el mapa`
        : outerShapeError
      : null,
    ...settingsFormIssues(settings).map((issue) => issue.message),
  ].filter((message): message is string => message !== null)
  const canSave = editing === 'outer' && outerRing !== null && zoneNameIssue(name) === null && configured !== null && !save.isPending
  const activeError = editing === 'outer' ? outerShapeError : holeError

  const onSave = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (outerRing === null || configured === null || !canSave) return
    save.mutate({
      id: editingZone?.id ?? null,
      draft: {
        name: name.trim(),
        ring: outerRing,
        holes: closedHoles,
        settings: configured,
        // Al redibujar, el backend rechaza la edición si otra persona cambió la zona mientras tanto.
        expectedVersion: editingZone?.version,
      },
    })
  }

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        <section className="flex min-h-0 flex-1 flex-col gap-2 rounded-2xl border border-surface-container-high/60 bg-surface-container-lowest p-2 shadow-sm">
          <PlaceSearch variant="inline" onSelect={(place) => { setFocusPoint({ latitude: place.latitude, longitude: place.longitude }); }} />
          <div className="flex flex-wrap items-center gap-1.5 px-1 text-[11px]">
            <span className="rounded-full bg-primary px-2.5 py-1 font-bold text-on-primary">
              Modo polígono · {editing === 'outer' ? 'exterior' : 'hueco'}
            </span>
            <Chip>{outerVertices.length} vértices exterior</Chip>
            <Chip tone="exclusion">{holes.length} {holes.length === 1 ? 'exclusión' : 'exclusiones'} (hole)</Chip>
            <Chip>{areaKm2 !== null ? `${areaKm2.toFixed(2)} km²` : 'área pendiente'}</Chip>
            <span className="ml-auto flex items-center gap-2 text-on-surface-variant">
              <Legend color="bg-primary/30 border border-primary" label="Ring" />
              <Legend color="bg-error/30 border border-error border-dashed" label="Hole" />
              <Legend color="bg-amber-600" label="Depot" />
            </span>
          </div>
          <div className="relative flex min-h-[360px] flex-1 flex-col">
            <LazyMapCanvas
              className="min-h-[360px] w-full flex-1 rounded-xl z-0"
              depot={depotPoint}
              drawing={activeVertices}
              reference={editing === 'hole' ? outerVertices : null}
              holes={holes}
              focus={focusPoint}
              fitBounds={fitBounds}
              highlight={viewedZone?.ring ?? null}
              highlightHoles={viewedZone?.holes ?? []}
              onMapClick={onMapClick}
              onVertexRemove={(vertex) => { updateActive((current) => removePoint(current, vertex)); }}
              onVertexClick={tool === 'erase' ? (vertex) => { updateActive((current) => removePoint(current, vertex)); } : undefined}
            />
            <MapToolbar
              tool={tool}
              holeActive={editing === 'hole'}
              canUndo={history.length > 0}
              canClear={activePoints.length > 0}
              canFit={activeVertices.length > 0}
              onTool={chooseTool}
              onHole={toggleHole}
              onUndo={undo}
              onClear={() => { updateActive(() => []); }}
              onFit={fitActive}
            />
          </div>
          <p className="px-1 text-[10px] text-on-surface-variant">
            {tool === 'depot'
              ? 'Herramienta bodega activa: cada clic en el mapa reubica la bodega. Elige otra herramienta para terminar.'
              : tool === 'erase'
                ? 'Herramienta quitar activa: haz clic sobre un vértice para quitarlo.'
                : 'Busca una calle o lugar (no marca puntos). Clic: agregar vértice · Atajos: 1 vértice, 2 exclusión, 3 quitar, 4 bodega, F encuadrar, Ctrl+Z deshacer.'}
          </p>
        </section>
      </div>

      <div className="flex min-h-0 min-w-0 flex-col gap-3 pr-1 xl:overflow-y-auto custom-scrollbar">
        <ZoneTabs
          label="Panel de zonas"
          active={panel}
          onChange={setPanel}
          tabs={[
            { id: 'list', label: 'Zonas registradas', badge: zonesQuery.isSuccess ? zonesQuery.data.length : null },
            { id: 'editor', label: 'Editor de zona', dot: editingZone !== null },
          ]}
        />

        {panel === 'list' && (
          <section className="rounded-xl border border-surface-container-high/60 bg-surface-container-lowest p-3">
            {zonesQuery.isPending && <p className="text-[11px] text-on-surface-variant">Cargando zonas…</p>}
            {zonesQuery.isError && <ErrorMessage>No pudimos cargar las zonas. {userMessage(zonesQuery.error)}</ErrorMessage>}
            {zonesQuery.isSuccess && (
              <ZoneList
                zones={zonesQuery.data}
                editingZoneId={editingZone?.id ?? null}
                onView={viewZone}
                onRedraw={startRedraw}
                onCancelRedraw={resetDraft}
              />
            )}
          </section>
        )}

        {panel === 'editor' && (
        <form className="flex flex-col gap-3 min-w-0" onSubmit={onSave}>
          {saved !== null && (
            <p role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-[11px] text-emerald-800">
              Zona {saved.zone.code} {saved.updated ? 'actualizada' : 'guardada'}.
            </p>
          )}

          <p className="text-[10px] text-on-surface-variant">
            Los campos marcados con * son obligatorios. Cada campo muestra un ejemplo y sus límites.
          </p>
          <Card icon="badge" title="Identificación y estado" aside={<StatusPill status={editingZone?.status ?? null} />}>
            <p className="text-[12px] font-bold text-on-surface">{editingZone === null ? 'Nueva zona' : `Redibujando ${editingZone.code}`}</p>
            <Field label="Nombre *">
              <input
                aria-invalid={name.trim() !== '' && zoneNameIssue(name) !== null ? true : undefined}
                autoComplete="off"
                className={inputClass}
                maxLength={LIMITS.zoneNameMax}
                onChange={(e) => { setName(e.target.value); }}
                placeholder="Ej. Hipercentro Financiero"
                value={name}
              />
              {name.trim() !== '' && zoneNameIssue(name) !== null ? (
                <span role="alert" className="text-[10px] font-medium text-error">{zoneNameIssue(name)}</span>
              ) : (
                <span className="text-[10px] text-on-surface-variant">
                  {name.trim() === '' ? 'Obligatorio · ' : ''}Entre {String(LIMITS.zoneNameMin)} y {String(LIMITS.zoneNameMax)} caracteres: letras, números y . - &amp; ( ) &apos;
                </span>
              )}
            </Field>
            <p className="text-[11px] text-on-surface-variant">
              Código: <span className="font-mono font-bold text-on-surface">{editingZone?.code ?? codePreview(name)}</span>
              {editingZone === null && <span> · se asigna al guardar</span>}
            </p>
            {editingZone !== null && editingZone.statusReason !== '' && (
              <p className="text-[11px] text-on-surface-variant">Último motivo de estado: {editingZone.statusReason}</p>
            )}
          </Card>

          <Card icon="pentagon" title="Geometría de entrega">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                <span className="block text-[10px] text-on-surface-variant">Perímetro exterior</span>
                <span className="font-mono font-bold text-primary">{outerVertices.length} vértices</span>
              </div>
              <div className="rounded-lg border border-error/30 bg-error-container/30 p-2.5">
                <span className="block text-[10px] text-on-surface-variant">Huecos excluidos</span>
                <span className="font-mono font-bold text-on-error-container">{holes.length} exclusión{holes.length === 1 ? '' : 'es'}</span>
              </div>
            </div>

            <p className="text-[11px] text-on-surface">
              {editing === 'outer' ? 'Exterior' : 'Hueco'} · Vértices: <span className="font-bold">{activeVertices.length}</span>
              {activeVertices.length < MIN_ZONE_VERTICES && <span className="text-on-surface-variant"> (mínimo {MIN_ZONE_VERTICES})</span>}
              <span className="text-on-surface-variant"> · Huecos: {holes.length}</span>
            </p>
            {activePoints.length > 0 && activeError !== null && <p className="text-[11px] text-on-surface-variant">{activeError}</p>}

            <div className="flex flex-wrap gap-2">
              {editing === 'outer' ? (
                <SecondaryButton disabled={outerShapeError !== null} onClick={startHole}>Agregar exclusión (hole)</SecondaryButton>
              ) : (
                <>
                  <PrimaryButton disabled={!holeReady} onClick={finishHole}>Terminar hueco</PrimaryButton>
                  <SecondaryButton onClick={cancelHole}>Cancelar hueco</SecondaryButton>
                </>
              )}
            </div>

            {holes.length > 0 && editing === 'outer' && (
              <ul className="flex flex-col gap-1 text-[11px] text-on-surface">
                {holes.map((hole, i) => (
                  <li key={`hole-${String(i)}`} className="flex items-center justify-between gap-2 rounded-md bg-error-container/20 px-2 py-1">
                    <span>Hueco {i + 1} · {hole.length} vértices</span>
                    <button className="font-semibold underline cursor-pointer" onClick={() => { removeHole(i); }} type="button">
                      Quitar hueco {i + 1}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {activeVertices.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-surface-container-high">
                <div className="grid grid-cols-[1fr_1.4fr_auto] bg-surface-container-low px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  <span>Vértice</span>
                  <span>Lat / Lng</span>
                  <span className="sr-only">Acción</span>
                </div>
                <ul className="divide-y divide-surface-container-high font-mono text-[11px]">
                  {activeVertices.slice(0, 4).map((vertex, i) => (
                    <li key={`v-${String(i)}`} className="grid grid-cols-[1fr_1.4fr_auto] items-center gap-2 px-3 py-1.5">
                      <span className="font-sans font-medium text-on-surface">V-{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-on-surface-variant">{vertex.latitude.toFixed(6)}, {vertex.longitude.toFixed(6)}</span>
                      <button
                        aria-label={`Quitar vértice V-${String(i + 1).padStart(2, '0')}`}
                        className="text-on-surface-variant hover:text-error cursor-pointer"
                        onClick={() => { updateActive((current) => removePoint(current, vertex)); }}
                        type="button"
                      >
                        <Icon name="close" />
                      </button>
                    </li>
                  ))}
                </ul>
                {activeVertices.length > 4 && (
                  <SecondaryButton onClick={() => { setVertexModal(true); }}>
                    {`Ver todos los vértices (${String(activeVertices.length)})`}
                  </SecondaryButton>
                )}
              </div>
            )}
          </Card>

          <ZoneSettingsForm value={settings} onChange={setSettings} />

          {missingItems.length > 0 && (
            <details className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
              <summary className="cursor-pointer font-semibold">
                Faltan {String(missingItems.length)} {missingItems.length === 1 ? 'dato' : 'datos'} para guardar
              </summary>
              <ul className="mt-1 list-disc pl-4">
                {missingItems.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </details>
          )}

          <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-surface-container-high bg-surface-container-lowest/95 p-3 backdrop-blur shadow-md">
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container cursor-pointer"
              onClick={undo}
              disabled={history.length === 0}
              type="button"
            >
              <Icon name="undo" />
              Deshacer
            </button>
            <div className="flex flex-wrap gap-2">
              {editingZone !== null && (
                <SecondaryButton onClick={resetDraft}>Cancelar redibujo</SecondaryButton>
              )}
              <PrimaryButton disabled={!canSave} type="submit">
                {save.isPending ? 'Guardando…' : editingZone === null ? 'Guardar zona' : 'Guardar cambios'}
              </PrimaryButton>
            </div>
          </div>
          {save.isError && <ErrorMessage>No se pudo guardar la zona. {userMessage(save.error)}</ErrorMessage>}
        </form>
        )}
      </div>

      {vertexModal && (
        <VertexListModal
          title={editing === 'outer' ? 'Exterior' : 'Hueco'}
          vertices={activeVertices}
          onRemove={(index) => {
            const vertex = activeVertices[index]
            if (vertex !== undefined) updateActive((current) => removePoint(current, vertex))
          }}
          onClose={() => { setVertexModal(false); }}
        />
      )}
    </>
  )
}

/** Coordenada de la bodega si los campos son números válidos; null si todavía no se capturó. */
function depotCoordinate(settings: SettingsForm): Coordinate | null {
  if (settings.depotLatitude.trim() === '' || settings.depotLongitude.trim() === '') return null
  const latitude = Number(settings.depotLatitude)
  const longitude = Number(settings.depotLongitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return { latitude, longitude }
}

/** Campos de texto: ahí las teclas escriben y no editan el trazo. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

function Icon({ name }: { name: string }) {
  return <span aria-hidden="true" className="material-symbols-outlined text-[16px]">{name}</span>
}

function Card({ icon, title, aside, children }: { icon: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-surface-container-high/70 bg-surface-container-lowest p-3 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 border-b border-surface-container-high pb-2">
        <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface">
          <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function StatusPill({ status }: { status: string | null }) {
  if (status === null) return <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">NUEVA</span>
  return status === 'ACTIVE' ? (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">ACTIVA</span>
  ) : (
    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">INACTIVA</span>
  )
}

function Chip({ tone = 'neutral', children }: { tone?: 'neutral' | 'exclusion'; children: ReactNode }) {
  const tones = {
    neutral: 'bg-primary/10 text-primary',
    exclusion: 'bg-error-container/50 text-on-error-container',
  }
  return <span className={`rounded-md px-2 py-0.5 font-mono font-medium ${tones[tone]}`}>{children}</span>
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px]">
      <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  )
}

function PrimaryButton({ children, disabled, onClick, type = 'button' }: { children: string; disabled?: boolean; onClick?: () => void; type?: 'button' | 'submit' }) {
  return (
    <button
      className="rounded-lg bg-primary px-3.5 py-1.5 text-[11px] font-bold text-on-primary shadow-sm cursor-pointer disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  )
}

function SecondaryButton({ children, disabled, onClick }: { children: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      className="rounded-lg border border-surface-container-high px-3 py-1.5 text-[11px] font-semibold text-on-surface cursor-pointer hover:bg-surface-container disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
