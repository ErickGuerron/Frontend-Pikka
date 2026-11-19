import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { getOrders } from '@/features/orders/api'
import { listActiveRoutes, SNAPSHOT_INTERVAL_MS } from '@/features/tracking/api'
import { AlertDialog } from '@/shared/ui/AlertDialog'
import { ActiveRoutesSection } from './ActiveRoutesSection'
import { addOrderToRoute, generateRoutePlan, isRoutingDemoMode, previewRoutePlan, routingErrorMessage } from './api'
import { toMapRoutes } from './mapRoutes'
import { NewOrdersSection } from './NewOrdersSection'
import { ProposalPanel } from './ProposalPanel'
import { countStops, lastRevealedOrderId, revealConfig, revealedRoutes } from './reveal'
import type { RoutePlan } from './types'

// Leaflet se descarga solo cuando hay una ruta que dibujar.
const RouteMap = lazy(() => import('./RouteMap').then((m) => ({ default: m.RouteMap })))

interface Proposal {
  date: string
  plan: RoutePlan
}

/**
 * Planificación de rutas. Muestra las rutas en proceso y los pedidos nuevos. De los pedidos nuevos se pueden
 * crear rutas (primero una propuesta que se arma a la vista y que el operador confirma) o sumarlos a una ruta
 * que ya está en ejecución.
 */
export function RoutesPage() {
  const queryClient = useQueryClient()
  const active = useQuery({ queryKey: ['tracking', 'active-routes'], queryFn: listActiveRoutes, refetchInterval: SNAPSHOT_INTERVAL_MS })
  const orders = useQuery({ queryKey: ['orders'], queryFn: getOrders })

  const [proposal, setProposal] = useState<Proposal | null>(null)
  // Cuántas paradas de la propuesta se muestran mientras se arma; null = completa, sin animación.
  const [shown, setShown] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['orders'] })
    void queryClient.invalidateQueries({ queryKey: ['tracking'] })
  }

  const preview = useMutation({
    mutationFn: previewRoutePlan,
    onSuccess: (plan, date) => {
      setNotice(null)
      setProposal({ date, plan })
      setShown(revealConfig.delayMs > 0 && countStops(plan) > 1 ? 1 : null)
    },
  })
  const confirm = useMutation({
    mutationFn: generateRoutePlan,
    onSuccess: (plan) => {
      setProposal(null)
      setShown(null)
      setNotice(`Rutas asignadas: ${String(plan.routes.length)} (${String(countStops(plan))} pedidos). Ya aparecen en proceso.`)
      refresh()
    },
  })
  const add = useMutation({
    mutationFn: ({ routeId, orderId }: { routeId: string; orderId: string }) => addOrderToRoute(routeId, orderId),
    onSuccess: (result) => {
      setNotice(`Pedido agregado como parada ${String(result.stop.sequence)} de la ruta en proceso.`)
      refresh()
    },
  })

  const total = proposal === null ? 0 : countStops(proposal.plan)
  const animating = shown !== null
  useEffect(() => {
    if (!animating) return
    const id = setInterval(() => { setShown((n) => (n === null || n + 1 >= total ? null : n + 1)); }, revealConfig.delayMs)
    return () => { clearInterval(id); }
  }, [animating, total])

  const activeRoutes = active.data ?? []
  const pendingOrders = useMemo(() => (orders.data ?? []).filter((o) => o.status === 'PENDING'), [orders.data])
  const visibleProposal = useMemo(() => (proposal === null ? [] : revealedRoutes(proposal.plan, shown)), [proposal, shown])

  // Las coordenadas de cada parada salen de la lista de pedidos: el plan y el seguimiento solo traen dirección y orden.
  const mapRoutes = useMemo(() => {
    const coords = new Map((orders.data ?? []).map((o) => [o.id, o]))
    return toMapRoutes(proposal === null ? (active.data ?? []) : visibleProposal, coords)
  }, [proposal, visibleProposal, active.data, orders.data])

  const busy = preview.isPending || confirm.isPending || add.isPending || proposal !== null
  const error = confirm.isError
    ? routingErrorMessage(confirm.error, 'generate')
    : preview.isError
      ? routingErrorMessage(preview.error, 'generate')
      : null

  return (
    <div className="flex flex-col gap-4 max-w-7xl">
      <div className="bg-white rounded-xl border border-[#cce7ea] p-5 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded border border-[#cce7ea] bg-[#e8f7f9] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#004b4e]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
            <span className="font-semibold">DOSSIER LOGÍSTICO · PLANIFICACIÓN DE RUTAS</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#004b4e] font-sans tracking-tight">Rutas</h1>
            {isRoutingDemoMode() ? (
              <span className="uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-mono font-bold text-[9px]">
                Demo · datos simulados
              </span>
            ) : null}
          </div>
          <p className="text-xs font-mono text-[#557b7f]">
            Rutas en proceso y pedidos nuevos. Crea rutas con los nuevos o súmalos a una ruta que ya salió.
          </p>
        </div>
      </div>

      {notice !== null ? (
        <div role="status" className="bg-teal-50 text-teal-900 border border-teal-200 rounded-xl p-4 font-mono text-xs">
          {notice}
        </div>
      ) : null}
      {error !== null ? (
        <div role="alert" className="bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab] rounded-xl p-4 font-mono text-xs">
          {error}
        </div>
      ) : null}

      {add.isError ? (
        <AlertDialog
          message={routingErrorMessage(add.error, 'add')}
          onClose={() => { add.reset(); }}
          title="No se puede agregar a la ruta"
        />
      ) : null}

      {proposal !== null ? (
        <ProposalPanel
          confirming={confirm.isPending}
          date={proposal.date}
          onConfirm={() => { confirm.mutate(proposal.date); }}
          onDiscard={() => { setProposal(null); setShown(null); }}
          routes={proposal.plan.routes}
          shown={shown}
          total={total}
          visibleRoutes={visibleProposal}
        />
      ) : null}

      {mapRoutes.length > 0 ? (
        <section className="bg-white rounded-xl border border-[#cce7ea] p-3 shadow-sm" aria-label="Mapa de rutas">
          <Suspense fallback={<p className="px-4 py-8 text-center text-xs font-mono text-[#557b7f]">Cargando mapa…</p>}>
            <RouteMap routes={mapRoutes} latestOrderId={animating ? lastRevealedOrderId(visibleProposal) : null} />
          </Suspense>
        </section>
      ) : null}

      <ActiveRoutesSection isError={active.isError} isLoading={active.isLoading} routes={activeRoutes} />
      <NewOrdersSection
        addingOrderId={add.isPending ? add.variables.orderId : null}
        busy={busy}
        onAdd={(routeId, orderId) => { setNotice(null); add.mutate({ routeId, orderId }); }}
        onCreate={(date) => { setNotice(null); preview.mutate(date); }}
        orders={pendingOrders}
        previewingDate={preview.isPending ? preview.variables : null}
        routes={activeRoutes}
      />
    </div>
  )
}
