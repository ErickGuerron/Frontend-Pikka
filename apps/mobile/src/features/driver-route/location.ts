import * as Location from 'expo-location'

export interface DriverLocation {
  latitude: number
  longitude: number
}

export const LOCATION_DENIED_MESSAGE =
  'Necesitamos tu ubicación para registrar la entrega. Actívala en los ajustes de la app.'

/** The driver refused location, or the device could not give a position. */
export class LocationUnavailableError extends Error {
  constructor() {
    super(LOCATION_DENIED_MESSAGE)
    this.name = 'LocationUnavailableError'
  }
}

/**
 * Current position, requested only when a result is registered (ADR 0007, section 4).
 * Foreground permission only: the app does not track the driver in the background.
 */
export async function captureDriverLocation(): Promise<DriverLocation> {
  const permission = await Location.requestForegroundPermissionsAsync()
  if (permission.status !== 'granted') throw new LocationUnavailableError()
  try {
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
    return { latitude: position.coords.latitude, longitude: position.coords.longitude }
  } catch {
    throw new LocationUnavailableError()
  }
}
