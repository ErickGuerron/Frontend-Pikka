import type { GeneratedRoute, RoutePlan } from './types'

/** Pausa entre una parada y la siguiente al mostrar cómo se arma el plan. 0 lo muestra completo de una vez. */
export const revealConfig = { delayMs: 700 }

export function countStops(plan: RoutePlan): number {
  return plan.routes.reduce((sum, route) => sum + route.stops.length, 0)
}

/**
 * Las primeras `shown` paradas del plan, ruta por ruta, en el orden en que el servidor las asignó.
 * Una ruta sin paradas visibles todavía no aparece. `null` muestra el plan completo.
 */
export function revealedRoutes(plan: RoutePlan, shown: number | null): GeneratedRoute[] {
  if (shown === null) return plan.routes
  let left = shown
  const out: GeneratedRoute[] = []
  for (const route of plan.routes) {
    if (left <= 0) break
    out.push({ ...route, stops: route.stops.slice(0, left) })
    left -= route.stops.length
  }
  return out
}

/** Pedido de la última parada visible, para resaltarla mientras se arma el plan. */
export function lastRevealedOrderId(routes: readonly GeneratedRoute[]): string | null {
  return routes.at(-1)?.stops.at(-1)?.orderId ?? null
}
