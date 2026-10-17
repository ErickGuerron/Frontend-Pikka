import { useEffect, useState } from 'react'
import type { Coordinate } from '../customer-orders/map/geo'
import { searchPlace } from '../customer-orders/map/photon'
import type { RouteStop } from './types'

/** Address -> point, kept for the session so a stop is looked up once. null means "not found". */
const found = new Map<string, Coordinate | null>()

/**
 * Points of the given stops, in order. A stop that already has coordinates uses them; the rest are looked up by
 * address one at a time (Photon's public instance is for low volume). Stops that cannot be placed are left out.
 */
export function useStopPoints(stops: readonly RouteStop[]): Coordinate[] {
  const [, refresh] = useState(0)
  const key = stops.map((s) => `${s.id}|${s.address}|${String(s.latitude)}|${String(s.longitude)}`).join(';')

  useEffect(() => {
    const controller = new AbortController()
    void (async () => {
      for (const stop of stops) {
        if (stop.latitude !== undefined || found.has(stop.address)) continue
        try {
          const place = await searchPlace(stop.address, controller.signal)
          found.set(stop.address, place === null ? null : { latitude: place.latitude, longitude: place.longitude })
        } catch {
          if (controller.signal.aborted) return
          found.set(stop.address, null)
        }
        refresh((n) => n + 1)
      }
    })()
    return () => { controller.abort() }
    // `key` stands for the stops: the effect only reruns when a stop or its address changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const points: Coordinate[] = []
  for (const stop of stops) {
    const point = stop.latitude !== undefined && stop.longitude !== undefined
      ? { latitude: stop.latitude, longitude: stop.longitude }
      : found.get(stop.address)
    if (point) points.push(point)
  }
  return points
}
