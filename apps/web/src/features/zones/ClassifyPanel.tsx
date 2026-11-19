import { useState, type ReactNode } from 'react'
import type { Coordinate } from '@/features/geo/types'
import { ErrorMessage } from '@/shared/ui/form'
import { cutoffStatus, formatMinutes, localClock, pointInRing, straightLineKm } from './metrics'
import { weekdayCodes, weekdayLabels, zonePriorityLabels } from './settings'
import type { Zone } from './types'

export interface ClassifyPanelProps {
  /** Punto evaluado, o null si todavía no se eligió ninguno. */
  point: Coordinate | null
  /** Dirección legible del punto elegido, si la hay. */
  placeLabel: string | null
  zone: Zone | null
  outside: boolean
  pending: boolean
  failed: boolean
  errorMessage: string | null
  /** Hora de referencia para el corte. Se inyecta para poder probarlo. */
  now?: Date
}

/**
 * Diagnóstico de cobertura de un punto: zona asignada, verificación de huecos, bodega, horario de corte
 * y capacidades. Todo lo que muestra sale del backend o de un cálculo local sobre esos mismos datos.
 */
export function ClassifyPanel({ point, placeLabel, zone, outside, pending, failed, errorMessage, now }: ClassifyPanelProps) {
  const [copied, setCopied] = useState(false)

  if (point === null) {
    return (
      <aside className="flex flex-col gap-3 p-5 text-on-surface-variant text-[12px]">
        <Header badge={{ tone: 'neutral', text: 'Sin punto' }} />
        <p>Busca una dirección o haz clic en el mapa para evaluar si un punto está cubierto por una zona.</p>
      </aside>
    )
  }

  const clock = zone === null ? null : localClock(zone.settings.timezone, now)
  const cutoff = zone === null ? null : cutoffStatus(zone.settings, clock)
  const holesHit = zone === null ? 0 : zone.holes.filter((hole) => pointInRing(point, hole)).length
  const depotKm = zone !== null && zone.settings.depotName !== '' ? straightLineKm(point, {
    latitude: zone.settings.depotLatitude,
    longitude: zone.settings.depotLongitude,
  }) : null

  const badge = pending
    ? { tone: 'neutral' as const, text: 'Clasificando…' }
    : zone !== null
      ? { tone: 'ok' as const, text: 'COBERTURA VÁLIDA (EN ZONA)' }
      : outside
        ? { tone: 'bad' as const, text: 'FUERA DE COBERTURA' }
        : { tone: 'neutral' as const, text: 'Sin resultado' }

  const copySummary = () => {
    if (zone === null) return
    const text = `ZONA: ${zone.code} | ${zone.name} | Bodega: ${zone.settings.depotName || 'sin asignar'} | Corte: ${zone.settings.cutoffTime} | Cobertura: OK`
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => { setCopied(false); }, 1800)
  }

  return (
    <aside className="flex flex-col gap-3 p-4 text-[12px] text-on-surface">
      <Header badge={badge} />

      <div aria-live="polite" className="flex flex-col gap-1">
        <p className="font-semibold text-on-surface-variant break-words">{placeLabel ?? 'Punto elegido'}</p>
        <p className="font-mono text-[10px] text-on-surface-variant">
          Lat {point.latitude.toFixed(6)} · Lng {point.longitude.toFixed(6)}
        </p>
        {zone !== null && (
          <p>
            Zona <span className="font-bold">{zone.name}</span> ({zone.code}).
          </p>
        )}
        {outside && <p>Ninguna zona cubre este punto.</p>}
        {pending && <p className="text-on-surface-variant">Clasificando.</p>}
        {failed && errorMessage !== null && <ErrorMessage className="text-[12px]">{errorMessage}</ErrorMessage>}
      </div>

      {zone !== null && (
        <>
          <Card>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono font-bold text-primary">{zone.code}</span>
                  <Pill tone={zone.status === 'ACTIVE' ? 'ok' : 'neutral'}>{zone.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}</Pill>
                  <Pill tone="neutral">{`Prioridad ${zonePriorityLabels[zone.settings.priority]}`}</Pill>
                </div>
                <p className="mt-1 font-semibold text-on-surface break-words">{zone.name}</p>
                {zone.settings.description !== '' && <p className="mt-0.5 text-[11px] text-on-surface-variant">{zone.settings.description}</p>}
              </div>
              <button
                className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container cursor-pointer"
                onClick={copySummary}
                title="Copiar ficha de cobertura"
                type="button"
              >
                <Icon name={copied ? 'done' : 'content_copy'} />
              </button>
            </div>

            <ul className="mt-3 flex flex-col gap-1.5">
              <Check ok>Dentro del polígono exterior (anillo verificado)</Check>
              {zone.holes.length === 0 ? (
                <Check ok>La zona no tiene huecos de exclusión</Check>
              ) : (
                <Check ok={holesHit === 0}>
                  {holesHit === 0
                    ? `Fuera de ${String(zone.holes.length)} hueco${zone.holes.length === 1 ? '' : 's'} de exclusión`
                    : `Dentro de un hueco de exclusión (${String(holesHit)})`}
                </Check>
              )}
              <Check ok={zone.status === 'ACTIVE'}>
                {zone.status === 'ACTIVE' ? 'Estado operativo: despacho habilitado' : `Zona inactiva: ${zone.statusReason || 'sin motivo registrado'}`}
              </Check>
            </ul>
          </Card>

          <Card>
            <SectionTitle icon="warehouse">Bodega de salida</SectionTitle>
            {depotKm === null ? (
              <p className="text-on-surface-variant">Esta zona aún no tiene bodega asignada: no se puede calcular el despacho.</p>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold break-words">{zone.settings.depotName}</p>
                  <p className="text-[11px] text-on-surface-variant">Distancia en línea recta. No incluye ruteo por calles.</p>
                </div>
                <p className="font-mono font-bold text-primary whitespace-nowrap">{depotKm.toFixed(1)} km</p>
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle icon="schedule">Horario y corte</SectionTitle>
            <div className="flex flex-wrap gap-1" aria-label="Días de servicio">
              {weekdayCodes.map((day) => {
                const active = zone.settings.serviceDays.includes(day)
                const isToday = clock?.weekday === day
                return (
                  <span
                    key={day}
                    title={`${weekdayLabels[day]}${active ? ': servicio' : ': sin servicio'}${isToday ? ' (hoy)' : ''}`}
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      active ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                    } ${isToday ? 'ring-2 ring-primary-fixed' : ''}`}
                  >
                    {weekdayLabels[day].charAt(0)}
                  </span>
                )
              })}
            </div>
            <p className="mt-2 text-[11px] text-on-surface-variant">
              Ventana {zone.settings.deliveryWindowFrom}–{zone.settings.deliveryWindowTo} · Despacho {zone.settings.dispatchTime} · {zone.settings.timezone}
            </p>
            {cutoff === null ? (
              <p className="mt-2 text-[11px] text-on-surface-variant">No se pudo leer la hora local de la zona.</p>
            ) : cutoff.acceptsToday ? (
              <p className="mt-2 font-semibold text-emerald-700">
                Acepta pedidos para hoy · corte {zone.settings.cutoffTime} (faltan {formatMinutes(cutoff.minutesToCutoff ?? 0)})
              </p>
            ) : cutoff.serviceToday ? (
              <p className="mt-2 font-semibold text-error">Corte de hoy ya pasó ({zone.settings.cutoffTime}): el pedido sería para el próximo día de servicio.</p>
            ) : (
              <p className="mt-2 font-semibold text-error">Hoy la zona no tiene servicio.</p>
            )}
          </Card>

          <Card>
            <SectionTitle icon="local_shipping">Capacidad configurada</SectionTitle>
            <dl className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-md bg-surface-container-low p-2">
                <dt className="text-on-surface-variant">Pedidos por ruta</dt>
                <dd className="font-mono font-bold">{zone.settings.maxOrdersPerRoute}</dd>
              </div>
              <div className="rounded-md bg-surface-container-low p-2">
                <dt className="text-on-surface-variant">Capacidad por ruta</dt>
                <dd className="font-mono font-bold">{zone.settings.routeCapacityKg} kg</dd>
              </div>
              <div className="col-span-2 rounded-md bg-surface-container-low p-2">
                <dt className="text-on-surface-variant">Límite diario</dt>
                <dd className="font-mono font-bold">{zone.settings.dailyOrderLimit} pedidos/día</dd>
                <dd className="text-[10px] text-on-surface-variant">Límite configurado: el consumo del día se mostrará cuando existan pedidos.</dd>
              </div>
            </dl>
          </Card>
        </>
      )}
    </aside>
  )
}

type Tone = 'ok' | 'bad' | 'neutral'

function Header({ badge }: { badge: { tone: Tone; text: string } }) {
  const tones: Record<Tone, string> = {
    ok: 'bg-emerald-600 text-white',
    bad: 'bg-error text-on-error',
    neutral: 'bg-surface-container-high text-on-surface-variant',
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Diagnóstico de cobertura</span>
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${tones[badge.tone]}`}>{badge.text}</span>
    </div>
  )
}

function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-xl border border-surface-container-high/70 bg-surface-container-lowest p-3 shadow-sm">{children}</section>
}

function SectionTitle({ icon, children }: { icon: string; children: string }) {
  return (
    <h2 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface">
      <Icon name={icon} className="text-primary" />
      {children}
    </h2>
  )
}

function Pill({ tone, children }: { tone: Tone; children: string }) {
  const tones: Record<Tone, string> = {
    ok: 'bg-emerald-100 text-emerald-800',
    bad: 'bg-error-container text-on-error-container',
    neutral: 'bg-surface-container-high text-on-surface-variant',
  }
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tones[tone]}`}>{children}</span>
}

function Check({ ok, children }: { ok: boolean; children: string }) {
  return (
    <li className={`flex items-start gap-1.5 ${ok ? 'text-on-surface' : 'text-error'}`}>
      <Icon name={ok ? 'check_circle' : 'cancel'} className={`mt-px text-[16px] ${ok ? 'text-emerald-600' : 'text-error'}`} />
      <span>{children}</span>
    </li>
  )
}

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined text-[18px] ${className}`}>
      {name}
    </span>
  )
}
