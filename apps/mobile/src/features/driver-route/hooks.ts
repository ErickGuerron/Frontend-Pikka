import { useCallback, useEffect, useState } from 'react'
import { ApiError, userMessage } from '../../api/errors'
import { advanceStopStatus, getMyRoute, isRouteUnavailable, moveStopFirst, registerStopResult } from './api'
import { captureDriverLocation } from './location'
import type { DriverRoute, ProgressStatus, StopResultInput } from './types'

export const UNAVAILABLE_MESSAGE = 'El servicio de rutas aún no está disponible'

/**
 * Message for a failed action. A 501/503/... from the endpoint means the server does not serve that
 * action yet, so the driver is told that instead of a generic error.
 */
function actionError(prefix: string, e: unknown): string {
  if (isRouteUnavailable(e)) return `${prefix} Esta acción aún no está disponible en el servidor.`
  return `${prefix} ${userMessage(e)}`
}

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
      setError(down ? UNAVAILABLE_MESSAGE : actionError('No pudimos cargar tu ruta.', e))
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
        setRoute((current) => current?.id === route.id
          ? { ...current, stops: current.stops.map((s) => (s.id === updated.stopId ? { ...s, status: updated.status, reason: input.reason ?? null } : s)) }
          : current)
        // A closed stop can admit a waiting order on this route or another in the zone.
        await load()
      } catch (e) {
        if (e instanceof ApiError && e.code === 'OUTSIDE_WINDOW_REASON_REQUIRED') {
          setError(null)
          throw e
        }
        if (e instanceof ApiError && e.code === 'OUTSIDE_ARRIVAL_RADIUS') {
          setError('Acércate al punto de entrega antes de marcar el pedido como entregado.')
          return
        }
        if (e instanceof ApiError && e.code === 'FAILED_PRECONDITION') {
          setError('La parada debe estar en camino para registrar su resultado.')
          return
        }
        if (e instanceof ApiError && e.status === 409) {
          await load()
          return
        }
        setError(actionError('No pudimos registrar la entrega.', e))
      }
    },
    [route, load],
  )

  /** Moves a stop forward one progress step (recogido, en camino). */
  const advance = useCallback(
    async (stopId: string, to: ProgressStatus) => {
      if (route === null) return
      try {
        const progress = await advanceStopStatus(route.id, stopId, to)
        setRoute({ ...route, stops: route.stops.map((s) => (s.id === stopId ? { ...s, status: progress.status } : s)) })
        setError(null)
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          await load()
          return
        }
        setError(actionError('No pudimos actualizar la parada.', e))
      }
    },
    [route, load],
  )

  const reorder = async (stopId: string, reason: string) => {
    if (route === null) return false
    setError(null)
    try {
      const location = await captureDriverLocation()
      await moveStopFirst(route.id, stopId, reason, location)
      await load()
      return true
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        await load()
        setError('La ruta cambió. Revisa las paradas antes de volver a intentarlo.')
      } else if (e instanceof ApiError && e.code === 'FAILED_PRECONDITION') {
        setError('No se pudo cambiar el orden sin comprometer la ruta o una ventana de entrega.')
      } else {
        setError(e instanceof ApiError ? actionError('No pudimos reordenar la ruta.', e) : 'Activa tu ubicación para reordenar la ruta.')
      }
      return false
    }
  }

  return { route, loading, error, unavailable, reload: () => load(), submit, advance, reorder }
}
