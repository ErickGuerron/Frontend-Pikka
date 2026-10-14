import { useCallback, useEffect, useState } from 'react'
import { ApiError, userMessage } from '../../api/errors'
import { getMyRoute, isRouteUnavailable, registerStopResult } from './api'
import type { DriverRoute, StopResultInput } from './types'

export const UNAVAILABLE_MESSAGE = 'El servicio de rutas aún no está disponible'

/** Loads the driver's route and lets the driver register the result of a stop. */
export function useDriverRoute() {
  const [route, setRoute] = useState<DriverRoute | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      setRoute(await getMyRoute(signal))
      setUnavailable(false)
    } catch (e) {
      if (signal?.aborted) return
      const down = isRouteUnavailable(e)
      setUnavailable(down)
      setError(down ? UNAVAILABLE_MESSAGE : userMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => {
      controller.abort()
    }
  }, [load])

  /** Sends the result and replaces the stop locally. A conflict reloads the route. */
  const submit = useCallback(
    async (stopId: string, input: StopResultInput) => {
      if (route === null) return
      try {
        const updated = await registerStopResult(route.id, stopId, input)
        setRoute({ ...route, stops: route.stops.map((s) => (s.id === stopId ? updated : s)) })
        setError(null)
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          await load()
          return
        }
        setError(userMessage(e))
      }
    },
    [route, load],
  )

  return { route, loading, error, unavailable, reload: () => load(), submit }
}
