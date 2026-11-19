import { deliveryStatusLabels, openStops, type TrackedRoute } from '@/features/tracking/types'

/** Rutas que ya están en ejecución, con el estado de cada parada. Se actualizan solas. */
export function ActiveRoutesSection({ routes, isLoading, isError }: { routes: readonly TrackedRoute[]; isLoading: boolean; isError: boolean }) {
  return (
    <section className="flex flex-col gap-3" aria-label="Rutas en proceso">
      <h2 className="text-sm font-bold text-[#004b4e] font-sans uppercase tracking-wider">Rutas en proceso</h2>
      {isLoading ? (
        <div role="status" className="bg-white rounded-xl border border-[#cce7ea] p-6 text-center font-mono text-xs text-[#557b7f]">
          Cargando rutas en proceso…
        </div>
      ) : isError ? (
        <div role="alert" className="bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab] rounded-xl p-4 font-mono text-xs">
          No pudimos cargar las rutas en proceso.
        </div>
      ) : routes.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#cce7ea] p-6 text-center font-mono text-xs text-[#557b7f]">
          No hay rutas en proceso.
        </div>
      ) : (
        routes.map((route) => (
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
                  <h3 className="text-sm font-bold text-[#004b4e] font-sans">{route.driverName}</h3>
                  <span className="text-[10px] font-mono text-[#557b7f]">Ruta {route.id.slice(0, 10)}</span>
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#004b4e] bg-[#e8f7f9] px-2.5 py-0.5 rounded border border-[#cce7ea] font-semibold">
                {openStops(route)} de {route.stops.length} abiertas
              </span>
            </div>
            <ol className="flex flex-col divide-y divide-[#cce7ea]/60 text-xs">
              {route.stops.map((stop) => {
                const done = stop.status === 'DELIVERED'
                return (
                  <li key={stop.orderId} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-[11px] text-[#004b4e] bg-[#e8f7f9] px-1.5 py-0.5 rounded border border-[#cce7ea]">
                        {String(stop.sequence).padStart(2, '0')}
                      </span>
                      <span className={`font-medium ${done ? 'text-[#557b7f] line-through' : 'text-[#061f23]'}`}>{stop.address}</span>
                    </div>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                        done ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {deliveryStatusLabels[stop.status]}
                    </span>
                  </li>
                )
              })}
            </ol>
          </article>
        ))
      )}
    </section>
  )
}
