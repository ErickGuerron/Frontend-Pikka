import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getOrderExceptions } from '@/features/orders/api'
import { formatDate, formatWindow } from '@/features/orders/format'
import { reviewReasonLabels, type Order, type ReviewAction } from '@/features/orders/types'
import { userMessage } from '@/shared/api/errors'
import { ReviewPanel } from './ReviewPanel'

const decisionMessages: Record<ReviewAction, string> = {
  CONFIRM: 'Pedido confirmado.',
  CORRECT: 'Pedido corregido y guardado.',
  REJECT: 'Pedido rechazado.',
}

/** Cola de excepciones: pedidos cuya validación automática no se cumplió (ADR 0007, sección 3). */
export function ExceptionsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const { data: orders = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['orders', 'exceptions'],
    queryFn: getOrderExceptions,
  })

  const selected: Order | null = orders.find((order) => order.id === selectedId) ?? null

  const handleDecided = (action: ReviewAction) => {
    setSelectedId(null)
    setFeedback(decisionMessages[action])
  }

  return (
    <div className="flex flex-col gap-2 pt-2 pb-6">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-on-surface tracking-tight">Excepciones</h1>
          <span className="uppercase tracking-wider text-primary bg-primary-fixed/60 px-2 py-0.5 rounded-full font-bold text-[9px]">
            Revisión
          </span>
        </div>
        <p className="text-[11px] text-on-surface-variant leading-tight">
          Pedidos que no cumplieron la validación automática. Confírmalos, corrígelos o recházalos con motivo.
        </p>
      </div>

      {feedback ? (
        <div role="status" className="flex items-center justify-between gap-2 bg-secondary-container/50 text-on-secondary-container rounded-lg px-3 py-2 text-[11px]">
          <span>{feedback}</span>
          <button className="text-[11px] font-semibold underline cursor-pointer" onClick={() => { setFeedback(null); }} type="button">
            Cerrar
          </button>
        </div>
      ) : null}

      {selected !== null ? (
        <ReviewPanel key={selected.id} order={selected} onDecided={handleDecided} onCancel={() => { setSelectedId(null); }} />
      ) : null}

      <section className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_-4px_rgba(19,42,47,0.06)] border border-surface-container-high/60 overflow-hidden">
        <div className="px-4 py-2.5 bg-surface-container-low/40 border-b border-surface-container">
          <h2 className="text-sm font-bold text-on-surface">Pendientes de revisión</h2>
        </div>

        {isLoading ? (
          <p role="status" className="px-4 py-8 text-center text-[11px] text-on-surface-variant">Cargando excepciones…</p>
        ) : isError ? (
          <div role="alert" className="px-4 py-6 flex flex-col items-center gap-2 text-center">
            <p className="text-[11px] text-error">No pudimos cargar las excepciones. {userMessage(error)}</p>
            <button
              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-semibold cursor-pointer disabled:opacity-50"
              disabled={isFetching}
              onClick={() => { void refetch(); }}
              type="button"
            >
              {isFetching ? 'Reintentando…' : 'Reintentar'}
            </button>
          </div>
        ) : orders.length === 0 ? (
          <p className="px-4 py-8 text-center text-[12px] text-on-surface">No hay pedidos pendientes de revisión.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <caption className="sr-only">Pedidos en revisión con fecha, ventana, dirección y motivos</caption>
              <thead className="bg-surface-container-low/60 text-on-surface-variant uppercase tracking-wider text-[9px]">
                <tr>
                  <th scope="col" className="px-4 py-2 font-bold">Fecha</th>
                  <th scope="col" className="px-4 py-2 font-bold">Ventana</th>
                  <th scope="col" className="px-4 py-2 font-bold">Dirección</th>
                  <th scope="col" className="px-4 py-2 font-bold">Motivos</th>
                  <th scope="col" className="px-4 py-2 font-bold"><span className="sr-only">Acción</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-container-low/40">
                    <td className="px-4 py-2 font-semibold text-on-surface whitespace-nowrap">{formatDate(order.deliveryDate)}</td>
                    <td className="px-4 py-2 text-on-surface-variant whitespace-nowrap">{formatWindow(order.windowStart, order.windowEnd)}</td>
                    <td className="px-4 py-2 text-on-surface">{order.address}</td>
                    <td className="px-4 py-2">
                      <ul className="flex flex-col gap-0.5">
                        {order.reviewReasons.map((reason) => (
                          <li key={reason} className="text-on-surface">{reviewReasonLabels[reason]}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                        disabled={selectedId === order.id}
                        onClick={() => { setFeedback(null); setSelectedId(order.id); }}
                        type="button"
                      >
                        Revisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
