import { useEffect, useState } from 'react'
import type { Coordinate } from '../customer-orders/map/geo'
import { getDriverRoutePlan } from './api'
import type { RoutePlan } from './plan'

export interface RoutePlanState {
  plan: RoutePlan | null
  /** Why the optimal route is not available right now (for example the route planner is down). Null when fine. */
  error: string | null
}

/**
 * Optimal plan of the active stops from the driver's position. It refetches when the origin or the set of
 * active stops changes. A failure is exposed as `error`, never swallowed: the screen says why there is no road.
 */
export function useRoutePlan(origin: Coordinate | null, activeKey: string, enabled: boolean): RoutePlanState {
  const [state, setState] = useState<RoutePlanState>({ plan: null, error: null })
  const originKey = origin === null ? '' : `${String(origin.latitude)},${String(origin.longitude)}`

  useEffect(() => {
    if (!enabled || origin === null) {
      setState({ plan: null, error: null })
      return
    }
    const controller = new AbortController()
    getDriverRoutePlan(origin, controller.signal)
      .then((plan) => { setState({ plan, error: null }) })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setState({ plan: null, error: err instanceof Error ? err.message : 'No se pudo calcular la ruta óptima.' })
      })
    return () => { controller.abort() }
    // originKey and activeKey stand for origin and active stops; the effect reruns only when they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, originKey, activeKey])

  return state
}
