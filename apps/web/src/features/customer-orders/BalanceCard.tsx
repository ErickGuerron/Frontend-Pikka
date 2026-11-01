import { useState } from 'react'
import { balanceReasonLabel, formatDueDate, formatMoney, hasDebt } from './balance'
import { DisputeControl } from './DisputeControl'
import { useMyBalance, usePayBalance } from './hooks'
import { outcomeOfError, outcomeOfPayment, type Outcome, type Tone } from './payment-outcome'

const toneClasses: Record<Tone, string> = {
  ok: 'border-[#cce7ea] bg-[#e8f7f9] text-[#004b4e]',
  warn: 'border-amber-300 bg-amber-50 text-amber-900',
}

/**
 * Lo que el cliente debe (ADR 0006): total, cada línea con su motivo y fecha límite, y el botón de pagar el
 * saldo completo con el cobro simulado. Sin deuda y sin un mensaje por mostrar, no ocupa espacio. Si el
 * servicio no responde, tampoco: la página de pedidos sigue funcionando.
 */
export function BalanceCard() {
  const balance = useMyBalance()
  const pay = usePayBalance()
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const data = balance.data
  const owes = data !== undefined && hasDebt(data)

  if (!owes && outcome === null) return null

  const onPay = () => {
    setOutcome(null)
    pay.mutate(undefined, {
      onSuccess: (payment) => { setOutcome(outcomeOfPayment(payment)) },
      onError: (error) => { setOutcome(outcomeOfError(error)) },
    })
  }

  const notice =
    outcome === null ? null : (
      <p role="status" className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-xs ${toneClasses[outcome.tone]}`}>
        <span>{outcome.text}</span>
        <button type="button" aria-label="Cerrar aviso de pago" className="cursor-pointer font-bold text-lg leading-none" onClick={() => { setOutcome(null) }}>
          ×
        </button>
      </p>
    )

  if (!owes) return notice

  return (
    <section aria-label="Tu saldo" className="flex flex-col gap-4 rounded-2xl border border-[#cce7ea] bg-white p-5 sm:p-6 shadow-sm">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-bold text-[#004b4e]">Tu saldo pendiente</h2>
        <p className="font-mono text-2xl font-bold text-[#004b4e]">{formatMoney(data.pendingSurcharge)}</p>
      </header>

      {data.blocked ? (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
          Tu cuenta está bloqueada por saldo pendiente: no puedes crear ni cancelar pedidos hasta que pagues.
        </p>
      ) : null}

      {data.lines.length > 0 ? (
        <ul className="flex flex-col divide-y divide-[#cce7ea]">
          {data.lines.map((line) => (
            <li key={line.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <div className="flex flex-col">
                <span className="font-semibold text-[#004b4e]">{balanceReasonLabel(line.reason)}</span>
                <span className="font-mono text-xs text-[#557b7f]">{`Pagar antes del ${formatDueDate(line.dueAt)}`}</span>
              </div>
              <span className="font-mono font-bold text-[#004b4e]">{formatMoney(line.amount)}</span>
              <div className="flex w-full justify-end">
                <DisputeControl line={line} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#557b7f] max-w-md">
          Pago simulado: no se hará ningún cargo real. No pedimos datos de tarjeta.
        </p>
        <button
          type="button"
          disabled={pay.isPending}
          className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-[#004b4e] hover:bg-[#0a6568] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-sm border border-[#004b4e] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onPay}
        >
          {pay.isPending ? 'Procesando…' : `Pagar saldo (${formatMoney(data.pendingSurcharge)})`}
        </button>
      </div>

      {notice}
    </section>
  )
}
