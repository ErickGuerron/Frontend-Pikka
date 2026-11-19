import { useState } from 'react'
import { ApiError } from '@/shared/api/errors'
import { isDisputable, type BalanceLine } from './balance'
import { useOpenDispute } from './hooks'

const minReason = 5
const maxReason = 300

/** Lo que se le dice al cliente cuando el servidor rechaza su disputa. */
function disputeErrorText(error: unknown): string {
  if (error instanceof ApiError && error.status === 422) return 'El plazo para disputar este recargo ya terminó o ya está pagado.'
  if (error instanceof ApiError && error.status === 409) return 'Este recargo ya tiene una disputa.'
  return 'No pudimos enviar tu disputa. Inténtalo de nuevo.'
}

/**
 * Lo que el cliente puede hacer con un recargo (ADR 0007, sección 6): disputarlo mientras dure el plazo, o ver en qué
 * quedó su disputa. Los demás cobros no se disputan y no muestran nada.
 */
export function DisputeControl({ line }: { line: BalanceLine }) {
  const dispute = useOpenDispute()
  const [editing, setEditing] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (line.disputeStatus === 'OPEN') return <Badge text="En disputa" tone="info" />
  if (line.disputeStatus === 'AGAINST') return <Badge text="Disputa rechazada" tone="warn" />
  if (!isDisputable(line)) return null

  if (!editing) {
    return (
      <button
        type="button"
        className="cursor-pointer rounded-lg border border-[#004b4e] px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#004b4e] hover:bg-[#e8f7f9]"
        onClick={() => { setEditing(true) }}
      >
        Disputar
      </button>
    )
  }

  const send = () => {
    const text = reason.trim()
    if (text.length < minReason || text.length > maxReason) {
      setError(`El motivo debe tener entre ${String(minReason)} y ${String(maxReason)} caracteres.`)
      return
    }
    setError(null)
    dispute.mutate(
      { surchargeId: line.id, reason: text },
      { onSuccess: () => { setEditing(false); setReason('') }, onError: (e) => { setError(disputeErrorText(e)) } },
    )
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <label className="flex flex-col gap-1 text-xs font-semibold text-[#004b4e]">
        Motivo de la disputa
        <textarea
          value={reason}
          maxLength={maxReason}
          rows={3}
          className="rounded-lg border border-[#cce7ea] p-2 text-sm font-normal text-[#004b4e]"
          onChange={(e) => { setReason(e.target.value) }}
        />
      </label>
      {error !== null ? <p role="alert" className="text-xs font-medium text-red-800">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={dispute.isPending}
          className="cursor-pointer rounded-lg bg-[#004b4e] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-50"
          onClick={send}
        >
          Enviar disputa
        </button>
        <button type="button" className="cursor-pointer px-2 text-xs text-[#557b7f] underline" onClick={() => { setEditing(false); setError(null) }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

function Badge({ text, tone }: { text: string; tone: 'info' | 'warn' }) {
  const classes = tone === 'info' ? 'border-[#cce7ea] bg-[#e8f7f9] text-[#004b4e]' : 'border-amber-300 bg-amber-50 text-amber-900'
  return <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide ${classes}`}>{text}</span>
}
