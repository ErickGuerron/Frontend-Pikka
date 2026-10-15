import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { generateRoutePlan, isRoutingDemoMode, routingErrorMessage } from './api'
import type { RoutePlan } from './types'

/** Genera las rutas del día y muestra el resultado (Sprint 3 y 4). */
export function RoutesPage() {
  const [plan, setPlan] = useState<RoutePlan | null>(null)

  const generate = useMutation({
    mutationFn: generateRoutePlan,
    onSuccess: (result) => { setPlan(result); },
  })

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
        <p role="alert" className="text-[11px] text-error">{routingErrorMessage(generate.error)}</p>
      ) : null}

      {plan !== null ? (
        <section className="flex flex-col gap-2" aria-label="Rutas generadas">
          {plan.routes.length === 0 ? (
            <p className="text-[12px] text-on-surface">No hubo rutas que armar.</p>
          ) : (
            plan.routes.map((route) => (
              <article key={route.id} className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 p-3">
                <h2 className="text-sm font-bold text-on-surface">{route.driverName}</h2>
                <ol className="mt-1 flex flex-col gap-1 text-[11px] text-on-surface">
                  {route.stops.map((stop) => (
                    <li key={stop.orderId}>
                      <span className="font-semibold">{stop.sequence}.</span> {stop.address}
                    </li>
                  ))}
                </ol>
              </article>
            ))
          )}
          {plan.unassignedOrderIds.length > 0 ? (
            <p role="status" className="text-[11px] text-on-surface-variant">
              {plan.unassignedOrderIds.length} pedido(s) sin repartidor. Quedan para una nueva generación.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
