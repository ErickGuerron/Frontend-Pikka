import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getOrderExceptions } from '@/features/orders/api'
import { formatDate, formatWindow } from '@/features/orders/format'
import { reviewReasonLabels, type Order, type ReviewAction } from '@/features/orders/types'
import { userMessage } from '@/shared/api/errors'
import { KpiGrid } from '@/shared/ui/kpi'
import { Pagination, usePagination } from '@/shared/ui/pagination'
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

  const pager = usePagination(orders)
  const selected: Order | null = orders.find((order) => order.id === selectedId) ?? null

  const handleDecided = (action: ReviewAction) => {
    setSelectedId(null)
    setFeedback(decisionMessages[action])
  }

  return (
    <div className="flex flex-col gap-5 pt-2 pb-16 font-sans">
      {/* Dossier Header */}
      <div className="bg-white rounded border border-[#cce7ea] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#e8f7f9] border border-[#cce7ea] text-[10px] font-mono tracking-widest uppercase text-[#004b4e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]" />
            <span>Consola Central · Revisión de Incidencias</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#004b4e] flex items-center gap-3">
            Excepciones
          </h1>
          <p className="text-xs sm:text-sm text-[#557b7f] font-normal leading-relaxed max-w-2xl">
            Pedidos que no cumplieron la validación automática. Confírmalos, corrígelos o recházalos con motivo auditado.
          </p>
        </div>
      </div>

      <KpiGrid
        items={[
          { label: 'En revisión', badge: 'COLA', value: orders.length, unit: 'pedidos', tag: 'Pendientes' },
          { label: 'Varios motivos', badge: 'ALERTA', value: orders.filter((o) => o.reviewReasons.length > 1).length, unit: 'pedidos', tag: 'Prioritarios' },
          { label: 'Motivos distintos', badge: 'TIPOS', value: new Set(orders.flatMap((o) => o.reviewReasons)).size, unit: 'tipos', tag: 'Incidencias' },
        ]}
      />

      {feedback ? (
        <div role="status" className="flex items-center justify-between gap-2 bg-[#e8f7f9] border border-[#cce7ea] text-[#006b5f] rounded-lg px-4 py-3 font-mono text-xs">
          <span>{feedback}</span>
          <button className="text-xs font-semibold underline cursor-pointer" onClick={() => { setFeedback(null); }} type="button">
            Cerrar
          </button>
        </div>
      ) : null}

      {selected !== null ? (
        <ReviewPanel key={selected.id} order={selected} onDecided={handleDecided} onCancel={() => { setSelectedId(null); }} />
      ) : null}

      <section className="bg-white rounded border border-[#cce7ea] shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-[#f7fcfc] border-b border-[#cce7ea]">
          <h2 className="text-xs font-bold font-mono text-[#004b4e] uppercase tracking-wider">Pendientes de revisión</h2>
        </div>

        {isLoading ? (
          <p role="status" className="px-4 py-8 text-center text-xs font-mono text-[#557b7f]">Cargando excepciones…</p>
        ) : isError ? (
          <div role="alert" className="px-4 py-6 flex flex-col items-center gap-2 text-center font-mono">
            <p className="text-xs text-[#ba1a1a]">No pudimos cargar las excepciones. {userMessage(error)}</p>
            <button
              className="px-3 py-1.5 rounded bg-[#004b4e] text-white text-xs uppercase tracking-wider font-semibold cursor-pointer disabled:opacity-50"
              disabled={isFetching}
              onClick={() => { void refetch(); }}
              type="button"
            >
              {isFetching ? 'Reintentando…' : 'Reintentar'}
            </button>
          </div>
        ) : orders.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs font-mono text-[#557b7f]">No hay pedidos pendientes de revisión.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <caption className="sr-only">Pedidos en revisión con fecha, ventana, dirección y motivos</caption>
              <thead className="bg-[#f7fcfc] text-[#557b7f] font-mono text-[10px] uppercase tracking-widest border-b border-[#cce7ea]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Ventana</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Dirección</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Motivos</th>
                  <th scope="col" className="px-4 py-3 font-semibold"><span className="sr-only">Acción</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cce7ea]">
                {pager.pageItems.map((order) => (
                  <tr key={order.id} className="hover:bg-[#f7fcfc] transition-colors">
                    <td className="px-4 py-3 font-semibold font-mono text-[#004b4e] whitespace-nowrap">{formatDate(order.deliveryDate)}</td>
                    <td className="px-4 py-3 font-mono text-[#557b7f] whitespace-nowrap">{formatWindow(order.windowStart, order.windowEnd)}</td>
                    <td className="px-4 py-3 text-[#061f23]">{order.address}</td>
                    <td className="px-4 py-3">
                      <ul className="flex flex-col gap-0.5">
                        {order.reviewReasons.map((reason) => (
                          <li key={reason} className="inline-flex items-center gap-1 text-[11px] font-mono text-[#004b4e] bg-[#e8f7f9] px-2 py-0.5 rounded border border-[#cce7ea] w-fit">
                            <span className="w-1 h-1 rounded-full bg-[#14b8a6]" />
                            {reviewReasonLabels[reason]}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="px-3.5 py-1.5 rounded bg-[#004b4e] hover:bg-[#0a6568] text-white font-mono text-xs uppercase tracking-wider font-semibold cursor-pointer disabled:opacity-50 transition-colors"
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
            <Pagination label="excepciones" {...pager} onPage={pager.setPage} />
          </div>
        )}
      </section>
    </div>
  )
}
