import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { localToday } from '@/features/orders/validation'
import { generateRoutePlan, insertLastMinuteOrder, isRoutingDemoMode, moveRouteStop, routingErrorMessage } from './api'
import type { RoutePlan } from './types'

/**
 * Genera las rutas del día, agrega pedidos de último momento y ajusta paradas a mano
 * (Sprint 3 y 4). Cada cambio devuelve el plan completo del servidor.
 */
export function RoutesPage() {
  const [plan, setPlan] = useState<RoutePlan | null>(null)
  const [targets, setTargets] = useState<Record<string, string>>({})

  const generate = useMutation({
    mutationFn: generateRoutePlan,
    onSuccess: (result) => { setPlan(result); },
  })

  const insert = useMutation({
    mutationFn: ({ current, orderId, routeId }: { current: RoutePlan; orderId: string; routeId: string }) =>
      insertLastMinuteOrder(current, orderId, routeId),
    onSuccess: (result) => { setPlan(result); },
  })

  const move = useMutation({
    mutationFn: ({ current, orderId, routeId }: { current: RoutePlan; orderId: string; routeId: string }) =>
      moveRouteStop(current, orderId, routeId),
    onSuccess: (result) => { setPlan(result); },
  })

  const adjusting = insert.isPending || move.isPending
  const adjustError = insert.isError ? insert.error : move.isError ? move.error : null

  const targetFor = (key: string, fallback: string | undefined) => targets[key] ?? fallback ?? ''
  const setTarget = (key: string, value: string) => { setTargets((prev) => ({ ...prev, [key]: value })); }

  return (
    <div className="flex flex-col gap-4 max-w-7xl">
      {/* Dossier Header */}
      <div className="bg-white rounded-xl border border-[#cce7ea] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded border border-[#cce7ea] bg-[#e8f7f9] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#004b4e]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
              <span className="font-semibold">DOSSIER LOGÍSTICO · PLANIFICACIÓN DE RUTAS</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-[#004b4e] font-sans tracking-tight">
                Rutas
              </h1>
              {isRoutingDemoMode() ? (
                <span className="uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-mono font-bold text-[9px]">
                  Demo · datos simulados
                </span>
              ) : null}
            </div>
            <p className="text-xs font-mono text-[#557b7f]">
              Arma las rutas del día con los pedidos y los repartidores disponibles.
            </p>
          </div>

          <div>
            <button
              className="px-4 py-2 rounded-lg bg-[#004b4e] hover:bg-[#0a6568] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-colors border border-[#004b4e] shadow-sm flex items-center gap-2"
              disabled={generate.isPending}
              onClick={() => { generate.mutate(localToday()); }}
              type="button"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                alt_route
              </span>
              <span>{generate.isPending ? 'Generando rutas…' : 'Generar rutas'}</span>
            </button>
          </div>
        </div>
      </div>

      {generate.isPending ? (
        <div role="status" className="bg-white rounded-xl border border-[#cce7ea] p-4 text-center font-mono text-xs text-[#557b7f]">
          Asignando pedidos a repartidores…
        </div>
      ) : null}
      {generate.isError ? (
        <div role="alert" className="bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab] rounded-xl p-4 font-mono text-xs">
          {routingErrorMessage(generate.error, 'generate')}
        </div>
      ) : null}
      {adjustError !== null ? (
        <div role="alert" className="bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab] rounded-xl p-4 font-mono text-xs">
          {routingErrorMessage(adjustError, 'adjust')}
        </div>
      ) : null}

      {plan !== null ? (
        <section className="flex flex-col gap-4" aria-label="Rutas generadas">
          {plan.routes.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#cce7ea] p-8 text-center font-mono text-xs text-[#557b7f]">
              No hubo rutas que armar.
            </div>
          ) : (
            plan.routes.map((route) => (
              <article key={route.id} className="bg-white rounded-xl border border-[#cce7ea] p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#cce7ea] pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="h-8 w-8 rounded-full bg-[#e8f7f9] text-[#004b4e] font-bold font-mono text-xs flex items-center justify-center border border-[#cce7ea]"
                    >
                      {route.driverName.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-[#004b4e] font-sans">{route.driverName}</h2>
                      <span className="text-[10px] font-mono text-[#557b7f]">
                        {route.stops.length} {route.stops.length === 1 ? 'parada asignada' : 'paradas asignadas'}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#006b5f] bg-[#e8f7f9] px-2.5 py-0.5 rounded border border-[#cce7ea] font-semibold">
                    Planificado
                  </span>
                </div>

                <ol className="flex flex-col divide-y divide-[#cce7ea]/60 text-xs">
                  {route.stops.map((stop) => {
                    const key = `move:${stop.orderId}`
                    const otherRoutes = plan.routes.filter((other) => other.id !== route.id)
                    return (
                      <li key={stop.orderId} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-[11px] text-[#004b4e] bg-[#e8f7f9] px-1.5 py-0.5 rounded border border-[#cce7ea]">
                            {String(stop.sequence).padStart(2, '0')}
                          </span>
                          <span className="text-[#061f23] font-medium">{stop.address}</span>
                        </div>
                        {otherRoutes.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <label className="sr-only" htmlFor={key}>Mover el pedido {stop.orderId} a</label>
                            <select
                              className="px-2 py-1 rounded border border-[#cce7ea] text-xs font-sans bg-white text-[#061f23]"
                              disabled={adjusting}
                              id={key}
                              onChange={(event) => { setTarget(key, event.target.value); }}
                              value={targetFor(key, otherRoutes[0]?.id)}
                            >
                              {otherRoutes.map((other) => (
                                <option key={other.id} value={other.id}>{other.driverName}</option>
                              ))}
                            </select>
                            <button
                              className="px-2.5 py-1 rounded font-mono text-[11px] font-bold uppercase tracking-wider border border-[#004b4e] text-[#004b4e] bg-white hover:bg-[#e8f7f9] cursor-pointer disabled:opacity-50 transition-colors"
                              disabled={adjusting}
                              onClick={() => {
                                move.mutate({ current: plan, orderId: stop.orderId, routeId: targetFor(key, otherRoutes[0]?.id) })
                              }}
                              type="button"
                            >
                              Mover
                            </button>
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ol>
              </article>
            ))
          )}

          {plan.unassignedOrderIds.length > 0 ? (
            <section className="bg-amber-50/60 rounded-xl border border-amber-200 p-5 shadow-sm" aria-label="Pedidos sin repartidor">
              <div className="flex items-center gap-2 border-b border-amber-200 pb-2.5 mb-3">
                <span className="material-symbols-outlined text-amber-800 text-lg" aria-hidden="true">
                  warning
                </span>
                <h2 className="text-sm font-bold text-amber-900 font-sans">Sin repartidor</h2>
              </div>
              <ul className="flex flex-col divide-y divide-amber-200/60 text-xs">
                {plan.unassignedOrderIds.map((orderId) => {
                  const key = `insert:${orderId}`
                  return (
                    <li key={orderId} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                      <span className="font-mono font-semibold text-amber-950">Pedido {orderId}</span>
                      <div className="flex items-center gap-1.5">
                        <label className="sr-only" htmlFor={key}>Asignar el pedido {orderId} a</label>
                        <select
                          className="px-2 py-1 rounded border border-amber-300 text-xs font-sans bg-white text-[#061f23]"
                          disabled={adjusting || plan.routes.length === 0}
                          id={key}
                          onChange={(event) => { setTarget(key, event.target.value); }}
                          value={targetFor(key, plan.routes[0]?.id)}
                        >
                          {plan.routes.map((route) => (
                            <option key={route.id} value={route.id}>{route.driverName}</option>
                          ))}
                        </select>
                        <button
                          className="px-3 py-1 rounded font-mono text-[11px] font-bold uppercase tracking-wider bg-[#004b4e] hover:bg-[#0a6568] text-white cursor-pointer disabled:opacity-50 transition-colors"
                          disabled={adjusting || plan.routes.length === 0}
                          onClick={() => {
                            insert.mutate({ current: plan, orderId, routeId: targetFor(key, plan.routes[0]?.id) })
                          }}
                          type="button"
                        >
                          Asignar
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
