import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type SyntheticEvent } from 'react'
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
  editingZoneId: string | null
  /** Muestra la zona en el mapa sin entrar en modo edición. */
  onView: (zone: Zone) => void
  onRedraw: (zone: Zone) => void
}

/**
 * Zonas registradas con sus acciones: redibujar (solo activas), desactivar, reactivar y borrar
 * (solo inactivas). Cada acción pide un motivo obligatorio, que queda en la bitácora del servicio.
 */
export function ZoneList({ zones, editingZoneId, onView, onRedraw }: ZoneListProps) {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

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

  if (zones.length === 0) {
    return <p className="text-[11px] text-on-surface-variant">Aún no hay zonas. Dibuja la primera abajo.</p>
  }

  return (
    <ul className="flex flex-col gap-1">
      {zones.map((zone) => {
        const pendingHere = pending !== null && pending.zone.id === zone.id ? pending : null
        const isActive = zone.status === 'ACTIVE'
        return (
          <li
            key={zone.id}
            className={`flex flex-col gap-1 rounded-lg px-2 py-1 text-[11px] ${zone.id === editingZoneId ? 'bg-primary-fixed/60' : ''} ${isActive ? '' : 'opacity-70'}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-on-surface">
                <button aria-label={`Ver ${zone.code} en el mapa`} className="font-bold underline-offset-2 hover:underline cursor-pointer" onClick={() => { onView(zone); }} type="button">{zone.name}</button> ({zone.code}) · {zone.holes.length} {zone.holes.length === 1 ? 'hueco' : 'huecos'}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${isActive ? 'bg-primary-fixed/60 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  {zoneStatusLabels[zone.status]}
                </span>
              </span>
              <span className="flex gap-1">
                {isActive ? (
                  <>
                    <RowButton label={`Redibujar ${zone.code}`} onClick={() => { onRedraw(zone); }}>Redibujar</RowButton>
                    <RowButton label={`Desactivar ${zone.code}`} onClick={() => { openAction({ kind: 'status', zone, target: 'INACTIVE' }); }}>Desactivar</RowButton>
                  </>
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
