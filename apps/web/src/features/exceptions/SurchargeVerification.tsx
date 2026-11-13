import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type SyntheticEvent } from 'react'
import { http } from '@/shared/api/client'
import { userMessage } from '@/shared/api/errors'
import { object, ParseError, string } from '@/shared/api/parse'
import { inputClass } from '@/shared/ui/form'
import { getOrders } from '@/features/orders/api'
import type { Order } from '@/features/orders/types'
import { ReviewDialog } from './ReviewDialog'

const queryKey = ['surcharges', 'pending-verification'] as const

function parsePending(data: unknown) {
  if (!Array.isArray(data)) throw new ParseError('pending surcharges: expected array')
  return data.map((value: unknown) => {
    const row = object(value, 'pending surcharge')
    return { id: string(row, 'id'), orderId: string(row, 'orderId') }
  })
}

type Decision = 'CONFIRM' | 'WAIVE'

export function SurchargeVerification() {
  const [open, setOpen] = useState(false)
  const pending = useQuery({
    queryKey,
    enabled: open,
    queryFn: () => http.get('/api/v1/surcharges/pending-verification', parsePending),
  })
  return (
    <section className="rounded border border-[#cce7ea] bg-white p-4">
      <button
        className="text-sm font-semibold text-[#004b4e] underline"
        type="button"
        aria-expanded={open}
        onClick={() => { setOpen(!open); }}
      >
        Ver recargos por dirección incorrecta
      </button>
      {open ? (
        <div className="mt-4 space-y-3">
          {pending.isPending ? <p role="status">Cargando recargos…</p> : null}
          {pending.isError ? <p role="alert">{userMessage(pending.error)}</p> : null}
          {pending.data?.length === 0 ? <p>No hay recargos por verificar.</p> : null}
          {pending.data?.map((row) => <VerificationForm key={row.id} {...row} />)}
        </div>
      ) : null}
    </section>
  )
}

function VerificationForm({ id, orderId }: { id: string; orderId: string }) {
  const queryClient = useQueryClient()
  const [decision, setDecision] = useState<Decision>('CONFIRM')
  const [reason, setReason] = useState('')
  const [reassigning, setReassigning] = useState<Order | null>(null)
  const [reassigned, setReassigned] = useState(false)
  const loadOrder = useMutation({
    mutationFn: async () => {
      const order = (await getOrders()).find((item) => item.id === orderId)
      if (order?.status !== 'NOT_DELIVERED') throw new Error('El pedido ya no está disponible para reprogramar.')
      return order
    },
    onSuccess: setReassigning,
  })
  const resolve = useMutation({
    mutationFn: () => http.post(
      `/api/v1/surcharges/${encodeURIComponent(id)}/verification`,
      () => undefined,
      { body: { decision, reason: reason.trim() } },
    ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!resolve.isPending && reason.trim().length >= 5) resolve.mutate()
  }
  return (
    <div className="grid gap-2 rounded border border-[#cce7ea] p-3 text-sm">
      <p className="break-all font-semibold">Pedido {orderId}</p>
      <button
        className="justify-self-start text-[#004b4e] underline"
        type="button"
        disabled={loadOrder.isPending || resolve.isPending || reassigned}
        onClick={() => { loadOrder.mutate(); }}
      >
        {loadOrder.isPending ? 'Cargando pedido…' : 'Reprogramar antes de resolver'}
      </button>
      {reassigned ? <p role="status">Entrega reprogramada. El viaje se incluirá en el recargo si lo confirmas.</p> : null}
      {loadOrder.isError ? <p role="alert">{loadOrder.error.message}</p> : null}
      {reassigning === null ? null : (
        <ReviewDialog
          order={reassigning}
          reassignWrongAddress
          onClose={() => { setReassigning(null); }}
          onDecided={() => { setReassigning(null); setReassigned(true); }}
        />
      )}
      <form onSubmit={submit} className="grid gap-2">
      <label>
        Decisión tras verificar la dirección con el cliente
        <select
          className={inputClass}
          value={decision}
          disabled={resolve.isPending}
          onChange={(event) => { setDecision(event.target.value === 'WAIVE' ? 'WAIVE' : 'CONFIRM'); }}
        >
          <option value="CONFIRM">Confirmar recargo</option>
          <option value="WAIVE">Dispensar recargo</option>
        </select>
      </label>
      <label>
        Motivo de la decisión
        <textarea
          className={inputClass}
          minLength={5}
          maxLength={300}
          value={reason}
          required
          disabled={resolve.isPending}
          onChange={(event) => { setReason(event.target.value); }}
        />
      </label>
      {resolve.isError ? <p role="alert">{userMessage(resolve.error)}</p> : null}
      <button
        type="submit"
        className="justify-self-start rounded bg-[#004b4e] px-3 py-2 text-white disabled:opacity-50"
        disabled={resolve.isPending || reason.trim().length < 5}
      >
        {resolve.isPending ? 'Guardando…' : 'Guardar decisión'}
      </button>
      </form>
    </div>
  )
}
