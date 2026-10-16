import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { apiBaseUrl } from '@/shared/config/env'
import { userMessage } from '@/shared/api/errors'
import { isTrackingDemoMode, isTrackingLiveEnabled, listActiveRoutes, SNAPSHOT_INTERVAL_MS } from './api'
import { LiveTrackingClient, trackingSocketUrl, type LiveStatus, type SocketLike } from './live'
import { deliveryStatusLabels, openStops, type TrackedRoute } from './types'

const queryKey = ['tracking', 'active-routes'] as const

const liveLabels: Record<LiveStatus, string> = {
  live: 'En vivo',
  reconnecting: 'Reconectando…',
  offline: 'Sin conexión en vivo: actualizando cada pocos segundos',
}

/**
 * Seguimiento de las rutas en curso (Sprint 5). Con VITE_TRACKING_LIVE=true recibe el
 * snapshot por WebSocket; si la conexión cae, el REST sigue refrescando cada pocos segundos.
 */
export function TrackingPage() {
  const queryClient = useQueryClient()
  const [live, setLive] = useState<LiveStatus | null>(null)

  const { data: routes = [], isLoading, isError, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey,
    queryFn: listActiveRoutes,
    refetchInterval: SNAPSHOT_INTERVAL_MS,
  })

  useEffect(() => {
    if (!isTrackingLiveEnabled()) return undefined
    const client = new LiveTrackingClient({
      url: trackingSocketUrl(apiBaseUrl),
      createSocket: (url) => new WebSocket(url) as unknown as SocketLike,
      onSnapshot: (snapshot: TrackedRoute[]) => {
        queryClient.setQueryData(queryKey, snapshot)
      },
      onStatus: setLive,
    })
    client.start()
    return () => {
      client.stop()
    }
  }, [queryClient])

  return (
    <div className="flex flex-col gap-4 max-w-7xl">
      {/* Dossier Header */}
      <div className="bg-white rounded-xl border border-[#cce7ea] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded border border-[#cce7ea] bg-[#e8f7f9] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#004b4e]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6] animate-pulse" />
              <span className="font-semibold">DOSSIER TELEMETRÍA · RADAR EN TIEMPO REAL</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-[#004b4e] font-sans tracking-tight">
                Seguimiento
              </h1>
              {isTrackingDemoMode() ? (
                <span className="uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-mono font-bold text-[9px]">
                  Demo · datos simulados
                </span>
              ) : null}
            </div>
            <p className="text-xs font-mono text-[#557b7f]">
              Estado de cada parada de las rutas en curso. Se actualiza cada {SNAPSHOT_INTERVAL_MS / 1000} segundos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {live !== null ? (
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-semibold ${
                  live === 'live'
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
                role="status"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    live === 'live' ? 'bg-[#006b5f] animate-ping' : 'bg-amber-500'
                  }`}
                />
                <span>{liveLabels[live]}</span>
              </div>
            ) : null}
            {dataUpdatedAt > 0 ? (
              <span
                className="text-[11px] text-[#004b4e] bg-[#f0fafb] border border-[#cce7ea] px-2.5 py-1 rounded font-semibold"
                aria-live="polite"
              >
                Última actualización: {new Date(dataUpdatedAt).toLocaleTimeString('es-EC')}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div role="status" className="bg-white rounded-xl border border-[#cce7ea] p-12 text-center font-mono text-xs text-[#557b7f]">
          Cargando rutas en curso…
        </div>
      ) : isError ? (
        <div role="alert" className="bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab] rounded-xl p-6 flex flex-col items-start gap-3">
          <p className="font-mono text-xs">No pudimos cargar el seguimiento. {userMessage(error)}</p>
          <button
            className="px-4 py-2 rounded-lg bg-[#004b4e] hover:bg-[#0a6568] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-colors border border-[#004b4e]"
            disabled={isFetching}
            onClick={() => { void refetch(); }}
            type="button"
          >
            {isFetching ? 'Reintentando…' : 'Reintentar'}
          </button>
        </div>
      ) : routes.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#cce7ea] p-12 text-center font-mono text-xs text-[#557b7f]">
          No hay rutas en curso.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {routes.map((route) => (
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
                      Ruta activa · Despacho #PK-{route.id.slice(-4).toUpperCase()}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#004b4e] bg-[#e8f7f9] px-2.5 py-0.5 rounded border border-[#cce7ea] font-semibold">
                  {openStops(route)} paradas abiertas
                </span>
              </div>

              <ol className="flex flex-col divide-y divide-[#cce7ea]/60 text-xs">
                {route.stops.map((stop) => {
                  const isDelivered = stop.status === 'DELIVERED'
                  return (
                    <li key={stop.orderId} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded border ${
                            isDelivered
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-[#e8f7f9] text-[#004b4e] border-[#cce7ea]'
                          }`}
                        >
                          {String(stop.sequence).padStart(2, '0')}
                        </span>
                        <span className={`font-medium ${isDelivered ? 'text-[#557b7f] line-through' : 'text-[#061f23]'}`}>
                          {stop.address}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                          isDelivered
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {deliveryStatusLabels[stop.status]}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
