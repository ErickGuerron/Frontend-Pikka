import { parseTrackedRoutes, type TrackedRoute } from './types'

/** Estado de la conexión en vivo que muestra la pantalla. */
export type LiveStatus = 'live' | 'reconnecting' | 'offline'

/** Tras este número de fallos seguidos se deja de reintentar y queda el respaldo REST. */
export const MAX_RECONNECT_ATTEMPTS = 6
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 30_000

/** Espera antes del reintento n (0 = primero): 1 s, 2 s, 4 s… con tope de 30 s. */
export function nextReconnectDelay(attempt: number): number {
  return Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS)
}

/** Convierte la URL HTTP del Gateway en la URL del WebSocket de seguimiento. */
export function trackingSocketUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/+$/, '')
  const wsBase = base.replace(/^http/, 'ws')
  return `${wsBase}/api/v1/tracking/ws`
}

/** Subconjunto del WebSocket del navegador que usa el cliente; permite simularlo en pruebas. */
export interface SocketLike {
  onopen: ((event: unknown) => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onclose: ((event: unknown) => void) | null
  close: () => void
}

export type SocketFactory = (url: string) => SocketLike

export interface LiveClientOptions {
  url: string
  createSocket: SocketFactory
  onSnapshot: (routes: TrackedRoute[]) => void
  onStatus: (status: LiveStatus) => void
  /** Inyectable para pruebas. */
  setTimer?: (callback: () => void, ms: number) => unknown
  clearTimer?: (handle: unknown) => void
}

/**
 * Mantiene una conexión WebSocket con el snapshot de seguimiento. Si se cae, reintenta con
 * espera creciente. Tras MAX_RECONNECT_ATTEMPTS fallos queda "offline" y la pantalla sigue
 * con el respaldo REST.
 */
export class LiveTrackingClient {
  private socket: SocketLike | null = null
  private attempt = 0
  private timer: unknown = null
  private closedByUser = false
  private readonly setTimer: (callback: () => void, ms: number) => unknown
  private readonly clearTimer: (handle: unknown) => void

  constructor(private readonly options: LiveClientOptions) {
    this.setTimer = options.setTimer ?? ((callback, ms) => setTimeout(callback, ms))
    this.clearTimer = options.clearTimer ?? ((handle) => { clearTimeout(handle as ReturnType<typeof setTimeout>) })
  }

  start(): void {
    this.closedByUser = false
    this.connect()
  }

  stop(): void {
    this.closedByUser = true
    if (this.timer !== null) this.clearTimer(this.timer)
    this.timer = null
    this.socket?.close()
    this.socket = null
  }

  private connect(): void {
    const socket = this.options.createSocket(this.options.url)
    this.socket = socket

    socket.onopen = () => {
      this.attempt = 0
      this.options.onStatus('live')
    }
    socket.onmessage = (event) => {
      try {
        const routes = parseTrackedRoutes(JSON.parse(String(event.data)))
        this.options.onSnapshot(routes)
      } catch {
        // Un mensaje mal formado se descarta; el siguiente snapshot lo corrige.
      }
    }
    socket.onclose = () => {
      this.socket = null
      if (this.closedByUser) return
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (this.attempt >= MAX_RECONNECT_ATTEMPTS) {
      this.options.onStatus('offline')
      return
    }
    this.options.onStatus('reconnecting')
    const delay = nextReconnectDelay(this.attempt)
    this.attempt += 1
    this.timer = this.setTimer(() => {
      this.timer = null
      this.connect()
    }, delay)
  }
}
