import { formatDate } from '@/features/orders/format'
import type { GeneratedRoute } from './types'

interface ProposalPanelProps {
  /** Día de entrega que se está planificando, YYYY-MM-DD. */
  date: string
  /** Rutas de la propuesta completa. */
  routes: readonly GeneratedRoute[]
  /** Rutas visibles ahora, mientras la propuesta se va armando. */
  visibleRoutes: readonly GeneratedRoute[]
  /** Cuántas paradas se muestran mientras se arma; null cuando ya está completa. */
  shown: number | null
  total: number
  confirming: boolean
  onConfirm: () => void
  onDiscard: () => void
}

/**
 * Propuesta de rutas antes de asignar. Hasta que el operador confirma no se reserva ningún repartidor
 * ni se asigna ningún pedido. Una ruta sin repartidor libre impide confirmar.
 */
export function ProposalPanel({ date, routes, visibleRoutes, shown, total, confirming, onConfirm, onDiscard }: ProposalPanelProps) {
  const animating = shown !== null
  const withoutDriver = routes.filter((route) => route.driverId === '').length
  const canConfirm = !animating && !confirming && routes.length > 0 && withoutDriver === 0

  return (
    <section className="bg-white rounded-xl border-2 border-dashed border-[#14b8a6] p-5 shadow-sm flex flex-col gap-4" aria-label="Propuesta de rutas">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#004b4e] font-sans">Propuesta de rutas · {formatDate(date)}</h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded font-bold">
              Aún sin asignar
            </span>
          </div>
          <p className="text-xs font-mono text-[#557b7f]">
            Revisa la propuesta. Hasta que confirmes no se reserva ningún repartidor ni se asigna ningún pedido.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 rounded-lg border border-[#004b4e] text-[#004b4e] bg-white hover:bg-[#e8f7f9] font-mono text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-colors"
            disabled={confirming}
            onClick={onDiscard}
            type="button"
          >
            Descartar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#004b4e] hover:bg-[#0a6568] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-[#004b4e] shadow-sm"
            disabled={!canConfirm}
            onClick={onConfirm}
            type="button"
          >
            {confirming ? 'Asignando…' : 'Confirmar y asignar'}
          </button>
        </div>
      </div>

      {animating ? (
        <div role="status" className="bg-[#e8f7f9] rounded-lg border border-[#cce7ea] p-3 text-center font-mono text-xs text-[#004b4e]">
          Armando las rutas: parada {shown} de {total}…
        </div>
      ) : null}

      {routes.length === 0 ? (
        <p className="text-center font-mono text-xs text-[#557b7f] py-4">No hay pedidos pendientes que armar para esta fecha.</p>
      ) : null}

      {!animating && withoutDriver > 0 ? (
        <p role="alert" className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 font-mono text-xs">
          {withoutDriver === 1 ? 'A una ruta' : `A ${String(withoutDriver)} rutas`} no le queda un repartidor disponible. No se puede confirmar
          hasta que haya uno libre; descarta la propuesta o inténtalo de nuevo más tarde.
        </p>
      ) : null}

      {visibleRoutes.map((route) => (
        <article key={route.id} className="rounded-lg border border-[#cce7ea] p-4">
          <div className="flex items-center justify-between border-b border-[#cce7ea] pb-2.5 mb-2.5">
            <div>
              <h3 className="text-sm font-bold text-[#004b4e] font-sans">
                {route.driverId === '' ? 'Sin repartidor disponible' : route.driverName === '' ? 'Repartidor asignado' : route.driverName}
              </h3>
              <span className="text-[10px] font-mono text-[#557b7f]">
                {route.stops.length} {route.stops.length === 1 ? 'parada' : 'paradas'}
              </span>
            </div>
            <span
              className={`font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded border font-semibold ${
                route.driverId === '' ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-[#e8f7f9] text-[#006b5f] border-[#cce7ea]'
              }`}
            >
              {route.driverId === '' ? 'Falta repartidor' : 'Propuesta'}
            </span>
          </div>
          <ol className="flex flex-col divide-y divide-[#cce7ea]/60 text-xs">
            {route.stops.map((stop) => (
              <li key={stop.orderId} className="flex items-center gap-2.5 py-2">
                <span className="font-mono font-bold text-[11px] text-[#004b4e] bg-[#e8f7f9] px-1.5 py-0.5 rounded border border-[#cce7ea]">
                  {String(stop.sequence).padStart(2, '0')}
                </span>
                <span className="text-[#061f23] font-medium">{stop.address}</span>
              </li>
            ))}
          </ol>
        </article>
      ))}
    </section>
  )
}
