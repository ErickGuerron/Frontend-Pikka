import { Platform } from 'react-native'

/**
 * Gateway origin, e.g. http://10.0.2.2:8080 (Android emulator) or http://<LAN-IP>:8080.
 * Paths are built as `/api/v1/...`. EXPO_PUBLIC_* values are inlined at bundle time,
 * so the variable must be referenced literally and Metro restarted (`npx expo start -c`) after changes.
 */
export function normalizeBaseUrl(raw: string | undefined): string {
  const value = (raw ?? '').trim().replace(/\/+$/, '')
  return value === '' ? 'http://localhost:8080' : value
}

/**
 * 10.0.2.2 is the Android emulator's alias for the host machine and does not exist
 * in a browser, so the web build (Expo web) talks to localhost instead.
 */
export function resolveBaseUrlForPlatform(baseUrl: string, platform: string): string {
  return platform === 'web' ? baseUrl.replace('//10.0.2.2', '//localhost') : baseUrl
}

export const API_BASE_URL = resolveBaseUrlForPlatform(normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL), Platform.OS)

/** True when the in-memory demo adapter replaces the (not yet existing) customer order endpoints. */
export function isDemoMode(): boolean {
  return process.env.EXPO_PUBLIC_MOCK_CUSTOMER_ORDERS === 'true'
}

/** True when the in-memory demo replaces the (not yet existing) driver route endpoints. */
export function isDriverDemoMode(): boolean {
  return process.env.EXPO_PUBLIC_MOCK_DRIVER_ROUTE === 'true'
}
