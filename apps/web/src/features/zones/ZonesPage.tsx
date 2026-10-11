import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useCurrentUser } from '@/features/auth/hooks'
import { AddressPicker } from '@/features/geo/AddressPicker'
import type { Place } from '@/features/geo/photon'
import type { Coordinate } from '@/features/geo/types'
import { ApiError, userMessage } from '@/shared/api/errors'
import { ErrorMessage } from '@/shared/ui/form'
import { classifyPoint } from './api'
import { DrawZonePanel } from './DrawZonePanel'
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
            : 'Traza el exterior de la zona: la figura se ajusta sola a un trapecio o cuadrado convexo. Puedes agregar huecos (dona) dentro.'}
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
        <DrawZonePanel />
      )}
    </div>
  )
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
