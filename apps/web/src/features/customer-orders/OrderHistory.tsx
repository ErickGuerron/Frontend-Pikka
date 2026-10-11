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
    <section aria-labelledby="history-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="history-title" className="text-lg font-bold text-on-surface">
          Historial de Pedidos
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            aria-label="Buscar por dirección o código"
            placeholder="Buscar por dirección o código"
            className="w-full rounded-lg border border-surface-container-high bg-surface-container-lowest px-3 py-2 text-sm sm:w-64"
            value={query}
            onChange={(e) => { setQuery(e.target.value) }}
          />
          <select
            aria-label="Filtrar por estado"
            className="rounded-lg border border-surface-container-high bg-surface-container-lowest px-3 py-2 text-sm"
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
        <p className="text-sm text-on-surface-variant">Tu historial aparecerá aquí.</p>
      ) : visible.length === 0 ? (
        <p role="status" className="text-sm text-on-surface-variant">
          Ningún pedido coincide con la búsqueda.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((order) => (
            <li key={order.id} className="flex flex-col gap-2 rounded-2xl border border-surface-container-high/60 bg-surface-container-lowest p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-on-surface">{orderCode(order.id)}</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-xs text-on-surface-variant">
                {formatDate(order.deliveryDate)} · {formatWindow(order.windowStart, order.windowEnd)}
              </p>
              <p className="text-sm text-on-surface">{order.address}</p>
              <button
                type="button"
                aria-label={`Ver detalle del pedido ${orderCode(order.id)}`}
                className="mt-1 cursor-pointer self-start text-sm font-semibold text-primary hover:underline"
                onClick={() => { onSelect(order) }}
              >
                Ver detalle
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
