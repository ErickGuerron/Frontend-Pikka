import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { userMessage } from '@/shared/api/errors'
import { getOrders } from './api'
import { formatDate, formatWindow } from './format'
import { OrderForm } from './OrderForm'
import { type Order, type OrderStatus, orderStatusLabels, orderStatuses } from './types'

type StatusFilter = OrderStatus | 'ALL'

const statusStyles: Record<OrderStatus, string> = {
  PENDING: 'bg-secondary-container/40 text-on-secondary-container',
  PENDING_REVIEW: 'bg-orange-100 text-orange-800',
  ROUTE_ASSIGNED: 'bg-primary-fixed/70 text-primary',
  PICKED_UP: 'bg-primary-fixed/50 text-primary',
  IN_TRANSIT: 'bg-primary text-on-primary',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  NOT_DELIVERED: 'bg-amber-100 text-amber-800',
  CANCELLED: 'bg-error-container text-on-error-container',
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
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length
  const inRouteCount = orders.filter((o) => IN_ROUTE.includes(o.status)).length
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length

  const handleCreated = (order: Order) => {
    setShowForm(false)
    setFeedback(`Pedido registrado para el ${formatDate(order.deliveryDate)}, ventana ${formatWindow(order.windowStart, order.windowEnd)}.`)
  }

  return (
    <div className="flex flex-col gap-2 pt-2 pb-6">
      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-on-surface tracking-tight">Pedidos</h1>
            <span className="uppercase tracking-wider text-primary bg-primary-fixed/60 px-2 py-0.5 rounded-full font-bold text-[9px]">
              Fase 2
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-tight">
            Registra pedidos con dirección, fecha y ventana de entrega, y consulta su estado logístico.
          </p>
        </div>
        {showForm ? null : (
          <button
            className="flex items-center gap-1 bg-primary hover:bg-on-primary-fixed-variant text-on-primary px-2.5 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer text-[11px] font-semibold self-start lg:self-auto"
            onClick={() => { setFeedback(null); setShowForm(true); }}
            type="button"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">add_box</span>
            <span>Nuevo pedido</span>
          </button>
        )}
      </div>

      {/* Confirmación de acción completada (visibilidad del estado del sistema) */}
      {feedback ? (
        <div role="status" className="flex items-center justify-between gap-2 bg-secondary-container/50 text-on-secondary-container rounded-lg px-3 py-2 text-[11px]">
          <span>{feedback}</span>
          <button className="text-[11px] font-semibold underline cursor-pointer" onClick={() => { setFeedback(null); }} type="button">
            Cerrar
          </button>
        </div>
      ) : null}

      {showForm ? (
        <OrderForm onCancel={() => { setShowForm(false); }} onCreated={handleCreated} />
      ) : null}

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Kpi label="Total" value={orders.length} unit="pedidos" icon="inventory_2" />
        <Kpi label="Pendientes" value={pendingCount} unit="por asignar" icon="schedule" />
        <Kpi label="En ruta" value={inRouteCount} unit="asignados o en camino" icon="route" />
        <Kpi label="Entregados" value={deliveredCount} unit="completados" icon="check_circle" />
      </div>

      {/* Tabla con filtro */}
      <section className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_-4px_rgba(19,42,47,0.06)] border border-surface-container-high/60 overflow-hidden">
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-surface-container-low/40 border-b border-surface-container">
          <h2 className="text-sm font-bold text-on-surface">Listado de pedidos</h2>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="orders-status-filter">
              Estado
            </label>
            <select
              id="orders-status-filter"
              className="bg-surface-container-low border border-surface-container-high rounded-lg px-2 py-1 text-[11px] text-on-surface"
              onChange={(e) => { setStatusFilter(toStatusFilter(e.target.value)); }}
              value={statusFilter}
            >
              <option value="ALL">Todos</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>{orderStatusLabels[status]}</option>
              ))}
            </select>
            {statusFilter === 'ALL' ? null : (
              <button className="text-[11px] font-semibold text-primary underline cursor-pointer" onClick={() => { setStatusFilter('ALL'); }} type="button">
                Limpiar filtro
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <p role="status" className="px-4 py-8 text-center text-[11px] text-on-surface-variant">Cargando pedidos…</p>
        ) : isError ? (
          <div role="alert" className="px-4 py-6 flex flex-col items-center gap-2 text-center">
            <p className="text-[11px] text-error">No pudimos cargar los pedidos. {userMessage(error)}</p>
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
          <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
            <span className="material-symbols-outlined text-3xl text-outline" aria-hidden="true">inbox</span>
            <p className="text-[12px] font-semibold text-on-surface">Aún no hay pedidos registrados</p>
            <p className="text-[11px] text-on-surface-variant">Registra el primero para empezar a planificar entregas.</p>
            {showForm ? null : (
              <button className="mt-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-semibold cursor-pointer" onClick={() => { setShowForm(true); }} type="button">
                Registrar primer pedido
              </button>
            )}
          </div>
        ) : visibleOrders.length === 0 ? (
          <p className="px-4 py-8 text-center text-[11px] text-on-surface-variant">No hay pedidos con ese estado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <caption className="sr-only">Pedidos registrados con fecha, ventana, dirección y estado</caption>
              <thead className="bg-surface-container-low/60 text-on-surface-variant uppercase tracking-wider text-[9px]">
                <tr>
                  <th scope="col" className="px-4 py-2 font-bold">Fecha</th>
                  <th scope="col" className="px-4 py-2 font-bold">Ventana</th>
                  <th scope="col" className="px-4 py-2 font-bold">Dirección</th>
                  <th scope="col" className="px-4 py-2 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {visibleOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-container-low/40">
                    <td className="px-4 py-2 font-semibold text-on-surface whitespace-nowrap">{formatDate(order.deliveryDate)}</td>
                    <td className="px-4 py-2 text-on-surface-variant whitespace-nowrap">{formatWindow(order.windowStart, order.windowEnd)}</td>
                    <td className="px-4 py-2 text-on-surface">{order.address}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${statusStyles[order.status]}`}>
                        {orderStatusLabels[order.status]}
                      </span>
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

interface KpiProps {
  label: string
  value: number
  unit: string
  icon: string
}

function Kpi({ label, value, unit, icon }: KpiProps) {
  return (
    <div className="bg-surface-container-lowest p-2.5 rounded-xl shadow-[0_8px_24px_-4px_rgba(19,42,47,0.06)] border border-surface-container-high/60 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-1">
        <span className="uppercase font-bold tracking-wider text-[9px] text-on-surface-variant">{label}</span>
        <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1 min-w-0">
        <span className="text-lg font-bold text-on-surface">{value}</span>
        <span className="text-[10px] text-on-surface-variant truncate">{unit}</span>
      </div>
    </div>
  )
}
