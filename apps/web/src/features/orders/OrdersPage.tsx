import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { userMessage } from '@/shared/api/errors'
import { KpiGrid } from '@/shared/ui/kpi'
import { Pagination, usePagination } from '@/shared/ui/pagination'
import { getOrders } from './api'
import { formatDate, formatWindow } from './format'
import { OrderForm } from './OrderForm'
import { type Order, type OrderStatus, orderStatusLabels, orderStatuses } from './types'

type StatusFilter = OrderStatus | 'ALL'

const statusStyles: Record<OrderStatus, string> = {
  PENDING: 'bg-[#e8f7f9] text-[#004b4e] border border-[#cce7ea]',
  PENDING_REVIEW: 'bg-[#fff3e0] text-[#693600] border border-[#ffdcc3]',
  ROUTE_ASSIGNED: 'bg-[#004b4e] text-white border border-[#004b4e]',
  PICKED_UP: 'bg-[#0a6568] text-white border border-[#0a6568]',
  IN_TRANSIT: 'bg-[#002628] text-[#2dd4bf] border border-[#14b8a6]/40',
  DELIVERED: 'bg-[#e8f7f9] text-[#006b5f] border border-[#cce7ea]',
  NOT_DELIVERED: 'bg-[#ffdad6]/60 text-[#ba1a1a] border border-[#ffdad6]',
  CANCELLED: 'bg-[#ffdad6]/60 text-[#ba1a1a] border border-[#ffdad6]',
}

const IN_ROUTE: readonly OrderStatus[] = ['ROUTE_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']

/** Traduce el valor del <select> a un filtro válido; cualquier valor desconocido vuelve a "Todos". */
function toStatusFilter(value: string): StatusFilter {
  if (value === 'ALL') return 'ALL'
  return orderStatuses.find((status) => status === value) ?? 'ALL'
}

export function OrdersPage() {
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [feedback, setFeedback] = useState<string | null>(null)

  const { data: orders = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  })

  const visibleOrders = statusFilter === 'ALL' ? orders : orders.filter((o) => o.status === statusFilter)
  const pager = usePagination(visibleOrders)
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length
  const inRouteCount = orders.filter((o) => IN_ROUTE.includes(o.status)).length
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length

  const handleCreated = (order: Order) => {
    setShowForm(false)
    setFeedback(`Pedido registrado para el ${formatDate(order.deliveryDate)}, ventana ${formatWindow(order.windowStart, order.windowEnd)}.`)
  }

  return (
    <div className="flex flex-col gap-5 pt-2 pb-16 font-sans">
      {/* Dossier Header */}
      <div className="bg-white rounded border border-[#cce7ea] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#e8f7f9] border border-[#cce7ea] text-[10px] font-mono tracking-widest uppercase text-[#004b4e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]" />
            <span>Consola Central · Despacho y Logística</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#004b4e] flex items-center gap-3">
            Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-[#557b7f] font-normal leading-relaxed max-w-2xl">
            Registra pedidos con dirección, fecha y ventana de entrega, y consulta su estado logístico en tiempo real.
          </p>
        </div>
        {showForm ? null : (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              className="px-4 py-2 bg-[#004b4e] hover:bg-[#0a6568] text-white font-mono text-xs uppercase tracking-wider rounded transition-colors border border-[#004b4e] flex items-center gap-2 shadow-sm cursor-pointer"
              onClick={() => { setFeedback(null); setShowForm(true); }}
              type="button"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">add_box</span>
              <span>Nuevo pedido</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmación de acción completada */}
      {feedback ? (
        <div role="status" className="flex items-center justify-between gap-2 bg-[#e8f7f9] border border-[#cce7ea] text-[#006b5f] rounded-lg px-4 py-3 font-mono text-xs">
          <span>{feedback}</span>
          <button className="text-xs font-semibold underline cursor-pointer" onClick={() => { setFeedback(null); }} type="button">
            Cerrar
          </button>
        </div>
      ) : null}

      {showForm ? (
        <OrderForm onCancel={() => { setShowForm(false); }} onCreated={handleCreated} />
      ) : null}

      {/* Indicadores estilo Dossier */}
      <KpiGrid
        items={[
          { label: 'Total', badge: 'GLOBAL', value: orders.length, unit: 'pedidos', tag: 'General' },
          { label: 'Pendientes', badge: 'ESPERA', value: pendingCount, unit: 'por asignar', tag: 'En cola' },
          { label: 'En ruta', badge: 'TRÁNSITO', value: inRouteCount, unit: 'asignados / camino', tag: 'Distribución' },
          { label: 'Entregados', badge: 'CIERRE', value: deliveredCount, unit: 'completados', tag: 'Finalizados' },
        ]}
      />

      {/* Tabla con filtro */}
      <section className="bg-white rounded border border-[#cce7ea] shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-[#f7fcfc] border-b border-[#cce7ea] flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-bold font-mono text-[#004b4e] uppercase tracking-wider">Listado de pedidos</h2>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#557b7f]" htmlFor="orders-status-filter">
              Estado
            </label>
            <select
              id="orders-status-filter"
              className="bg-white text-[#004b4e] font-mono text-xs px-2.5 py-1.5 rounded border border-[#cce7ea] cursor-pointer font-semibold outline-none focus:border-[#004b4e]"
              onChange={(e) => { setStatusFilter(toStatusFilter(e.target.value)); }}
              value={statusFilter}
            >
              <option value="ALL">Todos</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>{orderStatusLabels[status]}</option>
              ))}
            </select>
            {statusFilter === 'ALL' ? null : (
              <button className="text-xs font-mono font-semibold text-[#004b4e] hover:underline cursor-pointer" onClick={() => { setStatusFilter('ALL'); }} type="button">
                Limpiar filtro
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <p role="status" className="px-4 py-8 text-center text-xs font-mono text-[#557b7f]">Cargando pedidos…</p>
        ) : isError ? (
          <div role="alert" className="px-4 py-6 flex flex-col items-center gap-2 text-center font-mono">
            <p className="text-xs text-[#ba1a1a]">No pudimos cargar los pedidos. {userMessage(error)}</p>
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
          <div className="px-4 py-10 flex flex-col items-center gap-2 text-center">
            <span className="material-symbols-outlined text-3xl text-[#8ba7ab]" aria-hidden="true">inbox</span>
            <p className="text-sm font-bold text-[#004b4e] font-sans">Aún no hay pedidos registrados</p>
            <p className="text-xs text-[#557b7f] font-sans">Registra el primero para empezar a planificar entregas.</p>
            {showForm ? null : (
              <button className="mt-2 px-4 py-2 rounded bg-[#004b4e] text-white text-xs font-mono uppercase tracking-wider font-semibold cursor-pointer" onClick={() => { setShowForm(true); }} type="button">
                Registrar primer pedido
              </button>
            )}
          </div>
        ) : visibleOrders.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs font-mono text-[#557b7f]">No hay pedidos con ese estado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <caption className="sr-only">Pedidos registrados con fecha, ventana, dirección y estado</caption>
              <thead className="bg-[#f7fcfc] text-[#557b7f] font-mono text-[10px] uppercase tracking-widest border-b border-[#cce7ea]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Ventana</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Dirección</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cce7ea]">
                {pager.pageItems.map((order) => (
                  <tr key={order.id} className="hover:bg-[#f7fcfc] transition-colors">
                    <td className="px-4 py-3 font-semibold font-mono text-[#004b4e] whitespace-nowrap">{formatDate(order.deliveryDate)}</td>
                    <td className="px-4 py-3 font-mono text-[#557b7f] whitespace-nowrap">{formatWindow(order.windowStart, order.windowEnd)}</td>
                    <td className="px-4 py-3 text-[#061f23]">{order.address}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${statusStyles[order.status]}`}>
                        {orderStatusLabels[order.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination label="pedidos" {...pager} onPage={pager.setPage} />
          </div>
        )}
      </section>
    </div>
  )
}
