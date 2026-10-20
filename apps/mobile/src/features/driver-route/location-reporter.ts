import * as Location from 'expo-location'
import { useEffect, useState } from 'react'
import type { Coordinate } from '../customer-orders/map/geo'
import { reportDriverLocation } from './api'

/** How often the driver's position is sent while the route screen is open (driver-location spec S1). */
export const POSITION_INTERVAL_MS = 15_000

export type TrackingState = 'off' | 'on' | 'denied'

export interface DriverLocationReporter {
  tracking: TrackingState
  /** Last position read on this device, shown on the driver's own map. Null until the first read. */
  position: Coordinate | null
}

/**
 * Reports the driver's position every POSITION_INTERVAL_MS while `active` is true. Foreground only: the
 * timer stops when the screen loses focus or unmounts, and no background tracking runs (ADR 0007).
 * The position is kept in memory for the map only and is never logged (CUSTOMER rule: coordinates stay out of logs).
 */
export function useDriverLocationReporter(active: boolean): DriverLocationReporter {
  const [tracking, setTracking] = useState<TrackingState>('off')
  const [position, setPosition] = useState<Coordinate | null>(null)

  useEffect(() => {
    if (!active) {
      setTracking('off')
      setPosition(null)
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | undefined

    const send = async () => {
      try {
        const reading = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        if (cancelled) return
        const here = { latitude: reading.coords.latitude, longitude: reading.coords.longitude }
        setPosition(here)
        await reportDriverLocation(here, new Date())
      } catch {
        // A missed report is retried on the next tick; nothing about the position is logged.
      }
    }

    void (async () => {
      const permission = await Location.requestForegroundPermissionsAsync()
      if (cancelled) return
      if (permission.status !== 'granted') {
        setTracking('denied')
        return
      }
      setTracking('on')
      await send()
      if (cancelled) return
      timer = setInterval(() => {
        void send()
      }, POSITION_INTERVAL_MS)
    })()

    return () => {
      cancelled = true
      if (timer !== undefined) clearInterval(timer)
    }
  }, [active])

  return { tracking, position }
}
