import { useState } from 'react'
import { formatDate, formatWindow } from '@/features/orders/format'
import type { Order } from '@/features/orders/types'
import { openStops, type TrackedRoute } from '@/features/tracking/types'

interface NewOrdersSectionProps {
  /** Pedidos PENDING: todavía no están en ninguna ruta. */
  orders: readonly Order[]
  /** Rutas en proceso, a las que se puede sumar un pedido. */
  routes: readonly TrackedRoute[]
  /** Día que se está proponiendo ahora, para bloquear su botón. */
  previewingDate: string | null
  /** Pedido que se está agregando ahora. */
  addingOrderId: string | null
  busy: boolean
  onCreate: (deliveryDate: string) => void
  onAdd: (routeId: string, orderId: string) => void
}

/**
 * Pedidos nuevos agrupados por día de entrega. De cada grupo se pueden crear las rutas del día (con una
 * propuesta que se confirma) o sumar un pedido a una ruta que ya está en ejecución ese mismo día.
 */
export function NewOrdersSection({ orders, routes, previewingDate, addingOrderId, busy, onCreate, onAdd }: NewOrdersSectionProps) {
  const [targets, setTargets] = useState<Record<string, string>>({})
  const days = [...new Set(orders.map((o) => o.deliveryDate))].sort()

  return (
    <section className="flex flex-col gap-3" aria-label="Nuevos pedidos">
      <h2 className="text-sm font-bold text-[#004b4e] font-sans uppercase tracking-wider">Nuevos pedidos</h2>
      {days.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#cce7ea] p-6 text-center font-mono text-xs text-[#557b7f]">
          No hay pedidos nuevos esperando ruta.
        </div>
      ) : (
        days.map((day) => {
          const dayOrders = orders.filter((o) => o.deliveryDate === day)
          const dayRoutes = routes.filter((r) => r.id.startsWith(`${day}-`))
          return (
            <article key={day} className="bg-white rounded-xl border border-[#cce7ea] p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#cce7ea] pb-3 mb-1">
                <div>
                  <h3 className="text-sm font-bold text-[#004b4e] font-sans">{formatDate(day)}</h3>
                  <span className="text-[10px] font-mono text-[#557b7f]">
                    {dayOrders.length} {dayOrders.length === 1 ? 'pedido nuevo' : 'pedidos nuevos'}
                  </span>
                </div>
                <button
                  className="px-3 py-1.5 rounded-lg bg-[#004b4e] hover:bg-[#0a6568] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-colors border border-[#004b4e] flex items-center gap-2"
                  disabled={busy}
                  onClick={() => { onCreate(day); }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">alt_route</span>
                  <span>{previewingDate === day ? 'Armando propuesta…' : 'Crear rutas'}</span>
                </button>
              </div>
              <ul className="flex flex-col divide-y divide-[#cce7ea]/60 text-xs">
                {dayOrders.map((order) => {
                  const selected = targets[order.id] ?? dayRoutes[0]?.id ?? ''
                  const selectId = `add:${order.id}`
                  return (
                    <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-[#061f23] font-medium">{order.address}</span>
                        <span className="font-mono text-[10px] text-[#557b7f]">
                          {formatWindow(order.windowStart, order.windowEnd)}
                        </span>
                      </div>
                      {dayRoutes.length === 0 ? (
                        <span className="font-mono text-[10px] text-[#557b7f]">Sin ruta en proceso ese día</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <label className="sr-only" htmlFor={selectId}>Agregar el pedido {order.id} a</label>
                          <select
                            className="px-2 py-1 rounded border border-[#cce7ea] text-xs font-sans bg-white text-[#061f23]"
                            disabled={busy}
                            id={selectId}
                            onChange={(event) => { setTargets((prev) => ({ ...prev, [order.id]: event.target.value })); }}
                            value={selected}
                          >
                            {dayRoutes.map((route) => (
                              <option key={route.id} value={route.id}>
                                {route.driverName} · {openStops(route)} abiertas
                              </option>
                            ))}
                          </select>
                          <button
                            className="px-2.5 py-1 rounded font-mono text-[11px] font-bold uppercase tracking-wider border border-[#004b4e] text-[#004b4e] bg-white hover:bg-[#e8f7f9] cursor-pointer disabled:opacity-50 transition-colors"
                            disabled={busy}
                            onClick={() => { onAdd(selected, order.id); }}
                            type="button"
                          >
                            {addingOrderId === order.id ? 'Agregando…' : 'Agregar a ruta'}
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </article>
          )
        })
      )}
    </section>
  )
}
