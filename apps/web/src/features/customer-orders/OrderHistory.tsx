import { useMemo, useState } from 'react'
import { formatDate, formatWindow } from '@/features/orders/format'
import { OrderStatusBadge } from './OrderStatusBadge'
import { filterOrders, orderCode, orderStatuses, orderStatusLabels, type CustomerOrder, type OrderStatus } from './types'

interface OrderHistoryProps {
  orders: readonly CustomerOrder[]
  onSelect: (order: CustomerOrder) => void
}

export function OrderHistory({ orders, onSelect }: OrderHistoryProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL')
  const visible = useMemo(() => filterOrders(orders, query, status), [orders, query, status])

  return (
    <section id="historial-seccion" aria-labelledby="history-title" className="flex flex-col gap-4">
      {/* Header con título y filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="history-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#004b4e] font-sans">
            Historial de Pedidos
          </h2>
          <p className="font-mono text-xs text-[#557b7f]">
            Monitorea entregas pasadas, comprobantes fiscales y reordenamiento con 1-click.
          </p>
        </div>

        {/* Filtros de búsqueda y estado */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-[220px]">
            <span className="material-symbols-outlined absolute left-3 top-2 text-[#557b7f] text-[18px]" aria-hidden="true">
              search
            </span>
            <input
              type="search"
              aria-label="Buscar por dirección o código"
              placeholder="Buscar por dirección o código..."
              className="w-full rounded-xl border border-[#cce7ea] bg-white pl-9 pr-3 py-1.5 font-mono text-xs text-[#061f23] placeholder:text-[#8ba7ab] focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/40 shadow-xs"
              value={query}
              onChange={(e) => { setQuery(e.target.value) }}
            />
          </div>

          <select
            aria-label="Filtrar por estado"
            className="rounded-xl border border-[#cce7ea] bg-white px-3 py-1.5 font-mono text-xs text-[#004b4e] font-semibold focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/40 shadow-xs"
            value={status}
            onChange={(e) => { setStatus(e.target.value === 'ALL' ? 'ALL' : (orderStatuses.find((s) => s === e.target.value) ?? 'ALL')) }}
          >
            <option value="ALL">Todos los estados</option>
            {orderStatuses.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabels[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cce7ea] bg-white p-8 text-center">
          <p className="text-sm font-semibold text-[#004b4e]">Tu historial aparecerá aquí.</p>
          <p className="mt-1 font-mono text-xs text-[#557b7f]">Aún no tienes pedidos registrados en tu historial.</p>
        </div>
      ) : visible.length === 0 ? (
        <p role="status" className="rounded-xl border border-[#cce7ea] bg-white p-6 font-mono text-sm text-[#557b7f] text-center">
          Ningún pedido coincide con la búsqueda.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#cce7ea] bg-white shadow-sm">
          {/* Tabla Editorial con scroll horizontal en móvil */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f0fafb] text-[#557b7f] font-mono text-[10px] font-bold uppercase tracking-wider border-b border-[#cce7ea]">
                  <th className="py-3 px-4">ID Pedido &amp; Fecha</th>
                  <th className="py-3 px-4">Detalle del Envío</th>
                  <th className="py-3 px-4">Ventana</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cce7ea]/60 font-sans text-xs">
                {visible.map((order) => (
                  <tr key={order.id} className="hover:bg-[#f7fcfc] transition-colors group">
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-7 rounded-full bg-[#006b5f]" />
                        <div>
                          <span className="font-mono font-bold text-[#004b4e]">{orderCode(order.id)}</span>
                          <span className="block font-mono text-[11px] text-[#557b7f]">{formatDate(order.deliveryDate)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <p className="font-semibold text-[#061f23]">{order.address}</p>
                      <p className="font-mono text-[11px] text-[#557b7f]">Despacho en flota isotérmica Pikka</p>
                    </td>
                    <td className="py-3.5 px-4 align-middle font-mono text-xs text-[#004b4e]">
                      {formatWindow(order.windowStart, order.windowEnd)}
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 align-middle text-right">
                      <button
                        type="button"
                        aria-label={`Ver detalle del pedido ${orderCode(order.id)}`}
                        className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#cce7ea] bg-[#e8f7f9] hover:bg-[#004b4e] text-[#004b4e] hover:text-white font-mono text-xs font-semibold transition-colors active:scale-95"
                        onClick={() => { onSelect(order) }}
                      >
                        <span className="material-symbols-outlined text-[15px]" aria-hidden="true">visibility</span>
                        <span>Ver detalle</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
