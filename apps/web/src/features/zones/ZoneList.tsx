import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type SyntheticEvent } from 'react'
import { userMessage } from '@/shared/api/errors'
import { ErrorMessage, inputClass } from '@/shared/ui/form'
import { deleteZone, setZoneStatus } from './api'
import type { Zone, ZoneStatus } from './types'
import { zoneStatusLabels } from './types'

/** Lo mínimo que el backend acepta como motivo de un cambio o borrado. */
const MIN_REASON_LENGTH = 5

/** Acción pendiente de confirmar con su motivo. */
type PendingAction =
  | { kind: 'status'; zone: Zone; target: ZoneStatus }
  | { kind: 'delete'; zone: Zone }

export interface ZoneListProps {
  zones: Zone[]
  /** Zona que se está redibujando en el editor, o null. */
  editingZoneId: string | null
  /** Muestra la zona en el mapa sin entrar en modo edición. */
  onView: (zone: Zone) => void
  onRedraw: (zone: Zone) => void
  /** Sale del modo redibujo sin cambiar de panel. */
  onCancelRedraw: () => void
}

/**
 * Zonas registradas con búsqueda y acciones: redibujar (solo activas), cancelar el redibujo en curso,
 * desactivar, reactivar y borrar (solo inactivas). Cada cambio de estado pide un motivo que queda en la bitácora.
 */
export function ZoneList({ zones, editingZoneId, onView, onRedraw, onCancelRedraw }: ZoneListProps) {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('')
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    const list = needle === ''
      ? zones
      : zones.filter((z) => z.name.toLowerCase().includes(needle) || z.code.toLowerCase().includes(needle))
    // Las activas primero: son las que se redibujan y se usan para clasificar.
    return [...list].sort((a, b) => Number(b.status === 'ACTIVE') - Number(a.status === 'ACTIVE'))
  }, [zones, filter])

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['zones'] })

  const change = useMutation({
    mutationFn: async (action: PendingAction & { reason: string }) => {
      if (action.kind === 'delete') await deleteZone(action.zone.id, action.reason)
      else await setZoneStatus(action.zone.id, action.target, action.reason)
    },
    onSuccess: () => {
      setPending(null)
      setReason('')
      setReasonError(null)
      void refresh()
    },
  })

  const openAction = (action: PendingAction) => {
    change.reset()
    setReason('')
    setReasonError(null)
    setPending(action)
  }

  const confirm = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending === null) return
    const trimmed = reason.trim()
    if (trimmed.length < MIN_REASON_LENGTH) {
      setReasonError(`Escribe el motivo (mínimo ${String(MIN_REASON_LENGTH)} caracteres).`)
      return
    }
    change.mutate({ ...pending, reason: trimmed })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-lg border border-surface-container-high bg-surface-container-low px-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-on-surface-variant">search</span>
          <input
            aria-label="Buscar zona registrada"
            className="h-8 min-w-0 flex-1 bg-transparent text-[12px] text-on-surface placeholder:text-on-surface-variant focus:outline-none"
            onChange={(e) => { setFilter(e.target.value); }}
            placeholder="Buscar por nombre o código"
            type="text"
            value={filter}
          />
        </label>
        <span className="whitespace-nowrap text-[10px] font-semibold text-on-surface-variant">
          {visible.length} de {zones.length}
        </span>
      </div>

      {zones.length === 0 && <p className="text-[11px] text-on-surface-variant">Aún no hay zonas. Dibuja la primera abajo.</p>}
      {zones.length > 0 && visible.length === 0 && (
        <p className="text-[11px] text-on-surface-variant">Ninguna zona coincide con “{filter.trim()}”.</p>
      )}

      <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto custom-scrollbar pr-1">
        {visible.map((zone) => {
          const pendingHere = pending !== null && pending.zone.id === zone.id ? pending : null
          const isActive = zone.status === 'ACTIVE'
          const isEditing = zone.id === editingZoneId
          return (
            <li
              key={zone.id}
              className={`flex flex-col gap-1 rounded-lg border px-2.5 py-2 text-[11px] ${
                isEditing ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-surface-container-low'
              } ${isActive ? '' : 'opacity-70'}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <button
                    aria-label={`Ver ${zone.code} en el mapa`}
                    className="max-w-full truncate text-left font-bold text-on-surface underline-offset-2 hover:underline cursor-pointer"
                    onClick={() => { onView(zone); }}
                    type="button"
                  >
                    {zone.name}
                  </button>
                  <span className="ml-1.5 font-mono text-on-surface-variant">{zone.code}</span>
                  <span className="ml-1.5 text-on-surface-variant">
                    · {zone.holes.length} {zone.holes.length === 1 ? 'hueco' : 'huecos'}
                  </span>
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {zoneStatusLabels[zone.status]}
                  </span>
                  {isEditing && <span className="ml-1.5 text-[10px] font-bold text-primary">Editando</span>}
                </div>
                <span className="flex flex-wrap gap-1">
                  {isActive ? (
                    isEditing ? (
                      <RowButton label={`Cancelar redibujo ${zone.code}`} onClick={onCancelRedraw}>Cancelar redibujo</RowButton>
                    ) : (
                      <RowButton label={`Redibujar ${zone.code}`} onClick={() => { onRedraw(zone); }}>Redibujar</RowButton>
                    )
                  ) : null}
                  {isActive ? (
                    <RowButton label={`Desactivar ${zone.code}`} onClick={() => { openAction({ kind: 'status', zone, target: 'INACTIVE' }); }}>Desactivar</RowButton>
                  ) : (
                    <>
                      <RowButton label={`Reactivar ${zone.code}`} onClick={() => { openAction({ kind: 'status', zone, target: 'ACTIVE' }); }}>Reactivar</RowButton>
                      <RowButton label={`Eliminar ${zone.code}`} danger onClick={() => { openAction({ kind: 'delete', zone }); }}>Eliminar</RowButton>
                    </>
                  )}
                </span>
              </div>

              {!isActive && zone.statusReason !== '' && (
                <p className="text-[10px] text-on-surface-variant">Motivo: {zone.statusReason}</p>
              )}

              {pendingHere !== null && (
                <form className="flex flex-wrap items-end gap-2 pt-1" noValidate onSubmit={confirm}>
                  <label className="flex min-w-[16rem] flex-1 flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Motivo
                    <input
                      aria-label="Motivo"
                      aria-invalid={reasonError !== null ? true : undefined}
                      className={`${inputClass} normal-case font-normal`}
                      maxLength={300}
                      onChange={(e) => { setReason(e.target.value); setReasonError(null); }}
                      placeholder={pendingHere.kind === 'delete' ? 'Por qué se borra la zona' : 'Por qué cambia de estado'}
                      value={reason}
                    />
                  </label>
                  <button
                    className="rounded-lg bg-primary px-3 py-2 text-[11px] font-semibold text-on-primary cursor-pointer disabled:opacity-50"
                    disabled={change.isPending}
                    type="submit"
                  >
                    {change.isPending ? 'Guardando…' : confirmLabel(pendingHere)}
                  </button>
                  <button
                    className="rounded-lg px-3 py-2 text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                    onClick={() => { setPending(null); }}
                    type="button"
                  >
                    Cancelar
                  </button>
                  {reasonError !== null && <ErrorMessage className="w-full">{reasonError}</ErrorMessage>}
                  {change.isError && <ErrorMessage className="w-full">No se pudo completar la acción. {userMessage(change.error)}</ErrorMessage>}
                </form>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function confirmLabel(action: PendingAction): string {
  if (action.kind === 'delete') return 'Confirmar borrado'
  return action.target === 'INACTIVE' ? 'Confirmar desactivación' : 'Confirmar reactivación'
}

interface RowButtonProps {
  label: string
  danger?: boolean
  onClick: () => void
  children: string
}

function RowButton({ label, danger = false, onClick, children }: RowButtonProps) {
  return (
    <button
      aria-label={label}
      className={`rounded-md px-2 py-1 text-[11px] font-semibold cursor-pointer hover:bg-surface-container ${danger ? 'text-error' : 'text-primary'}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
