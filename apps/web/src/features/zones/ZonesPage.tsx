import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useCurrentUser } from '@/features/auth/hooks'
import { AddressPicker } from '@/features/geo/AddressPicker'
import type { Place } from '@/features/geo/photon'
import type { Coordinate } from '@/features/geo/types'
import { ApiError, userMessage } from '@/shared/api/errors'
import { classifyPoint, listZones } from './api'
import { ClassifyPanel } from './ClassifyPanel'
import { DrawZonePanel } from './DrawZonePanel'
import { straightLineKm } from './metrics'
import { ZoneBrowser } from './ZoneBrowser'
import { ZoneTabs } from './ZoneTabs'

/** Pestañas del panel de clasificar: el diagnóstico del punto (principal) o el listado de zonas. */
type ClassifyTab = 'diagnostico' | 'zonas'
import type { Zone } from './types'

type Mode = 'classify' | 'draw'

/**
 * Área de trabajo: en escritorio el mapa y el panel comparten una altura fija de la ventana; el mapa
 * queda visible y solo hace scroll la columna de datos. En pantallas pequeñas se apilan normalmente.
 */
const WORKSPACE = 'grid grid-cols-1 gap-3 xl:h-[calc(100dvh-9.5rem)] xl:min-h-[580px] xl:grid-cols-[minmax(0,1fr)_440px]'

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
  // Zonas para encontrarlas rápido en clasificar: al elegir una se resalta y se encuadra en el mapa.
  const zonesQuery = useQuery({
    queryKey: ['zones', 'list'],
    queryFn: listZones,
    enabled: effectiveMode === 'classify',
  })
  const [classifyTab, setClassifyTab] = useState<ClassifyTab>('diagnostico')
  const [browsed, setBrowsed] = useState<Zone | null>(null)
  const [browseFit, setBrowseFit] = useState<Coordinate[] | null>(null)
  const pickBrowsedZone = (picked: Zone) => {
    setBrowsed(picked)
    setBrowseFit([...picked.ring])
  }

  const zone: Zone | null = classification.data ?? null
  // Bodega de la zona clasificada: se dibuja en el mapa y se une al punto con su distancia.
  const classifiedDepot: Coordinate | null =
    zone !== null && zone.settings.depotName !== '' ? { latitude: zone.settings.depotLatitude, longitude: zone.settings.depotLongitude } : null
  const classifiedDepotKm =
    classifiedDepot !== null && classifyTarget !== null ? straightLineKm(classifyTarget, classifiedDepot) : null
  const outside = classification.error instanceof ApiError && classification.error.status === 404
  const classifyFailed = classification.isError && !outside

  return (
    <div className="flex flex-col gap-3 pt-2 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-on-surface tracking-tight">Zonas de reparto</h1>
            <span className="uppercase tracking-wider text-primary bg-primary-fixed/60 px-2 py-0.5 rounded-full font-bold text-[9px]">Mapa</span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-tight">
            {effectiveMode === 'classify'
              ? 'Evalúa si una dirección está cubierta por una zona y revisa su bodega, horario de corte y capacidad.'
              : 'Define el perímetro de cada zona, sus huecos de exclusión, la bodega de salida y la configuración de ruteo.'}
          </p>
        </div>

        {canDraw && (
          <div role="group" aria-label="Modo del mapa" className="inline-flex rounded-xl border border-surface-container-high p-1 bg-surface-container-low shadow-inner">
            <ModeButton active={effectiveMode === 'classify'} onClick={() => { setMode('classify'); }} icon="pin_drop">Clasificar punto</ModeButton>
            <ModeButton active={effectiveMode === 'draw'} onClick={() => { setMode('draw'); }} icon="draw">Dibujar zona</ModeButton>
          </div>
        )}
      </header>

      {effectiveMode === 'classify' ? (
        <div className={WORKSPACE}>
          <section className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-surface-container-high/60 bg-surface-container-lowest p-2 shadow-sm">
            <AddressPicker
              className="min-h-0 flex-1"
              mapClassName="h-[420px] xl:h-auto xl:min-h-[360px] xl:flex-1 w-full rounded-xl z-0"
              value={place}
              onChange={setPlace}
              highlight={zone?.ring ?? browsed?.ring ?? null}
              highlightHoles={zone?.holes ?? browsed?.holes ?? []}
              fitBounds={browseFit}
              depot={classifiedDepot}
              depotName={zone?.settings.depotName || null}
              depotDistanceLabel={classifiedDepotKm === null ? null : `${classifiedDepotKm.toFixed(1)} km en línea recta`}
            />
          </section>
          <section className="min-h-0 overflow-y-auto custom-scrollbar rounded-2xl border border-surface-container-high/60 bg-surface-container-low">
            <ZoneTabs
              label="Panel de clasificación"
              active={classifyTab}
              onChange={setClassifyTab}
              tabs={[
                { id: 'diagnostico', label: 'Diagnóstico' },
                { id: 'zonas', label: 'Zonas', badge: zonesQuery.isSuccess ? zonesQuery.data.length : null },
              ]}
            />
            {classifyTab === 'zonas' && (
              <div className="p-3">
                {zonesQuery.isSuccess && (
                  <ZoneBrowser zones={zonesQuery.data} selectedId={(zone ?? browsed)?.id ?? null} onPick={pickBrowsedZone} />
                )}
              </div>
            )}
            {classifyTab === 'diagnostico' && (
            <ClassifyPanel
              point={classifyTarget}
              placeLabel={place === null ? null : place.address === '' ? place.name : `${place.name}, ${place.address}`}
              zone={zone}
              outside={outside}
              pending={classification.isPending && classifyTarget !== null}
              failed={classifyFailed}
              errorMessage={classifyFailed ? `No pudimos clasificar el punto. ${userMessage(classification.error)}` : null}
            />
            )}
          </section>
        </div>
      ) : (
        <div className={WORKSPACE}>
          <DrawZonePanel />
        </div>
      )}
    </div>
  )
}

function ModeButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: string; children: string }) {
  return (
    <button
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer flex items-center gap-1.5 transition-colors ${
        active ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
      }`}
      onClick={onClick}
      type="button"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[16px]">{icon}</span>
      {children}
    </button>
  )
}
