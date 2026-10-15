import { useQuery } from '@tanstack/react-query'
import { userMessage } from '@/shared/api/errors'
import { isTrackingDemoMode, listActiveRoutes, SNAPSHOT_INTERVAL_MS } from './api'
import { deliveryStatusLabels, openStops } from './types'

/**
 * Seguimiento de las rutas en curso (Sprint 5). Muestra el estado de cada parada y se
 * refresca cada pocos segundos. Sin WebSocket todavía: el respaldo REST es el canal actual.
 */
export function TrackingPage() {
  const { data: routes = [], isLoading, isError, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['tracking', 'active-routes'],
    queryFn: listActiveRoutes,
    refetchInterval: SNAPSHOT_INTERVAL_MS,
  })

  return (
    <div className="flex flex-col gap-2 pt-2 pb-6">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-on-surface tracking-tight">Seguimiento</h1>
          {isTrackingDemoMode() ? (
            <span className="uppercase tracking-wider bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full font-bold text-[9px]">
              Demo · datos simulados
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-on-surface-variant leading-tight">
          Estado de cada parada de las rutas en curso. Se actualiza cada {SNAPSHOT_INTERVAL_MS / 1000} segundos.
        </p>
        {dataUpdatedAt > 0 ? (
          <p className="text-[10px] text-on-surface-variant" aria-live="polite">
            Última actualización: {new Date(dataUpdatedAt).toLocaleTimeString('es-EC')}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <p role="status" className="text-[11px] text-on-surface-variant">Cargando rutas en curso…</p>
      ) : isError ? (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="text-[11px] text-error">No pudimos cargar el seguimiento. {userMessage(error)}</p>
          <button
            className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-semibold cursor-pointer disabled:opacity-50"
            disabled={isFetching}
            onClick={() => { void refetch(); }}
            type="button"
          >
            {isFetching ? 'Reintentando…' : 'Reintentar'}
          </button>
        </div>
      ) : routes.length === 0 ? (
        <p className="text-[12px] text-on-surface">No hay rutas en curso.</p>
      ) : (
        routes.map((route) => (
          <article key={route.id} className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold text-on-surface">{route.driverName}</h2>
              <span className="text-[10px] text-on-surface-variant">{openStops(route)} paradas abiertas</span>
            </div>
            <ol className="mt-1 flex flex-col gap-1 text-[11px] text-on-surface">
              {route.stops.map((stop) => (
                <li key={stop.orderId} className="flex items-center justify-between gap-2">
                  <span>
                    <span className="font-semibold">{stop.sequence}.</span> {stop.address}
                  </span>
                  <span className="text-[10px] font-semibold text-on-surface-variant whitespace-nowrap">
                    {deliveryStatusLabels[stop.status]}
                  </span>
                </li>
              ))}
            </ol>
          </article>
        ))
      )}
    </div>
  )
}
