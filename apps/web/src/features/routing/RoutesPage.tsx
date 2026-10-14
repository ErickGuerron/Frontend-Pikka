import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
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
    <div className="flex flex-col gap-2 pt-2 pb-6">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-on-surface tracking-tight">Rutas</h1>
          {isRoutingDemoMode() ? (
            <span className="uppercase tracking-wider bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full font-bold text-[9px]">
              Demo · datos simulados
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-on-surface-variant leading-tight">
          Arma las rutas del día con los pedidos y los repartidores disponibles.
        </p>
      </div>

      <div>
        <button
          className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-semibold cursor-pointer disabled:opacity-50"
          disabled={generate.isPending}
          onClick={() => { generate.mutate(); }}
          type="button"
        >
          {generate.isPending ? 'Generando rutas…' : 'Generar rutas'}
        </button>
      </div>

      {generate.isPending ? (
        <p role="status" className="text-[11px] text-on-surface-variant">Asignando pedidos a repartidores…</p>
      ) : null}
      {generate.isError ? (
        <p role="alert" className="text-[11px] text-error">{routingErrorMessage(generate.error, 'generate')}</p>
      ) : null}
      {adjustError !== null ? (
        <p role="alert" className="text-[11px] text-error">{routingErrorMessage(adjustError, 'adjust')}</p>
      ) : null}

      {plan !== null ? (
        <section className="flex flex-col gap-2" aria-label="Rutas generadas">
          {plan.routes.length === 0 ? (
            <p className="text-[12px] text-on-surface">No hubo rutas que armar.</p>
          ) : (
            plan.routes.map((route) => (
              <article key={route.id} className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 p-3">
                <h2 className="text-sm font-bold text-on-surface">{route.driverName}</h2>
                <ol className="mt-1 flex flex-col gap-2 text-[11px] text-on-surface">
                  {route.stops.map((stop) => {
                    const key = `move:${stop.orderId}`
                    const otherRoutes = plan.routes.filter((other) => other.id !== route.id)
                    return (
                      <li key={stop.orderId} className="flex flex-wrap items-center gap-2">
                        <span>
                          <span className="font-semibold">{stop.sequence}.</span> {stop.address}
                        </span>
                        {otherRoutes.length > 0 ? (
                          <span className="flex items-center gap-1">
                            <label className="sr-only" htmlFor={key}>Mover el pedido {stop.orderId} a</label>
                            <select
                              className="px-1.5 py-0.5 rounded border border-outline-variant text-[10px] bg-surface-container-lowest"
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
                              className="px-2 py-0.5 rounded border border-primary text-primary text-[10px] font-semibold cursor-pointer disabled:opacity-50"
                              disabled={adjusting}
                              onClick={() => {
                                move.mutate({ current: plan, orderId: stop.orderId, routeId: targetFor(key, otherRoutes[0]?.id) })
                              }}
                              type="button"
                            >
                              Mover
                            </button>
                          </span>
                        ) : null}
                      </li>
                    )
                  })}
                </ol>
              </article>
            ))
          )}

          {plan.unassignedOrderIds.length > 0 ? (
            <section className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 p-3" aria-label="Pedidos sin repartidor">
              <h2 className="text-sm font-bold text-on-surface">Sin repartidor</h2>
              <ul className="mt-1 flex flex-col gap-2 text-[11px] text-on-surface">
                {plan.unassignedOrderIds.map((orderId) => {
                  const key = `insert:${orderId}`
                  return (
                    <li key={orderId} className="flex flex-wrap items-center gap-2">
                      <span>Pedido {orderId}</span>
                      <label className="sr-only" htmlFor={key}>Asignar el pedido {orderId} a</label>
                      <select
                        className="px-1.5 py-0.5 rounded border border-outline-variant text-[10px] bg-surface-container-lowest"
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
                        className="px-2 py-0.5 rounded bg-primary text-on-primary text-[10px] font-semibold cursor-pointer disabled:opacity-50"
                        disabled={adjusting || plan.routes.length === 0}
                        onClick={() => {
                          insert.mutate({ current: plan, orderId, routeId: targetFor(key, plan.routes[0]?.id) })
                        }}
                        type="button"
                      >
                        Asignar
                      </button>
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
