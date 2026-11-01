import { describe, expect, it } from 'vitest'
import { LiveTrackingClient, MAX_RECONNECT_ATTEMPTS, nextReconnectDelay, trackingSocketUrl, type LiveStatus, type SocketLike } from './live'
import type { TrackedRoute } from './types'

const snapshot = [
  { id: 'r-1', driverName: 'Luis Andrade', stops: [{ orderId: 'o-1', address: 'Av. Amazonas', sequence: 1, status: 'PICKED_UP' }] },
]

/** Simula el WebSocket del navegador y el reloj para controlar reintentos sin esperar. */
function harness() {
  const sockets: FakeSocket[] = []
  const statuses: LiveStatus[] = []
  const snapshots: TrackedRoute[][] = []
  const timers: { callback: () => void; ms: number; id: number }[] = []
  let nextId = 1

  class FakeSocket implements SocketLike {
    onopen: ((event: unknown) => void) | null = null
    onmessage: ((event: { data: unknown }) => void) | null = null
    onclose: ((event: unknown) => void) | null = null
    closed = false
    close() {
      this.closed = true
    }
    open() {
      this.onopen?.({})
    }
    receive(data: unknown) {
      this.onmessage?.({ data })
    }
    drop() {
      this.onclose?.({})
    }
  }

  const client = new LiveTrackingClient({
    url: 'ws://gateway/api/v1/tracking/ws',
    createSocket: () => {
      const socket = new FakeSocket()
      sockets.push(socket)
      return socket
    },
    onSnapshot: (routes) => { snapshots.push(routes); },
    onStatus: (status) => { statuses.push(status); },
    setTimer: (callback, ms) => {
      const id = nextId++
      timers.push({ callback, ms, id })
      return id
    },
    clearTimer: (handle) => {
      const index = timers.findIndex((t) => t.id === handle)
      if (index >= 0) timers.splice(index, 1)
    },
  })

  /** Dispara el siguiente reintento pendiente, como si pasara el tiempo de espera. */
  const fireNextTimer = () => {
    const next = timers.shift()
    next?.callback()
    return next
  }

  return { client, sockets, statuses, snapshots, timers, fireNextTimer }
}

describe('cálculo de reintentos y URL', () => {
  it('espera 1 s, 2 s, 4 s… con tope de 30 s', () => {
    expect(nextReconnectDelay(0)).toBe(1000)
    expect(nextReconnectDelay(1)).toBe(2000)
    expect(nextReconnectDelay(2)).toBe(4000)
    expect(nextReconnectDelay(10)).toBe(30000)
  })

  it('convierte la URL HTTP del Gateway en la del WebSocket', () => {
    expect(trackingSocketUrl('http://localhost:8080/')).toBe('ws://localhost:8080/api/v1/tracking/ws')
    expect(trackingSocketUrl('https://api.pikka.test')).toBe('wss://api.pikka.test/api/v1/tracking/ws')
  })
})

describe('conexión en vivo', () => {
  it('pasa a en vivo al abrir y entrega cada snapshot válido', () => {
    const h = harness()
    h.client.start()
    h.sockets[0]?.open()
    h.sockets[0]?.receive(JSON.stringify(snapshot))

    expect(h.statuses).toEqual(['live'])
    expect(h.snapshots).toHaveLength(1)
    expect(h.snapshots[0]?.[0]?.driverName).toBe('Luis Andrade')
  })

  it('descarta mensajes mal formados sin cortar la conexión', () => {
    const h = harness()
    h.client.start()
    h.sockets[0]?.open()
    h.sockets[0]?.receive('{no es json')
    h.sockets[0]?.receive(JSON.stringify([{ id: 'r', driverName: 'X', stops: [{ status: 'LOST' }] }]))

    expect(h.snapshots).toHaveLength(0)
    expect(h.statuses).toEqual(['live'])
  })

  it('al caerse la conexión reintenta después de la primera espera', () => {
    const h = harness()
    h.client.start()
    h.sockets[0]?.open()
    h.sockets[0]?.drop()

    expect(h.statuses.at(-1)).toBe('reconnecting')
    expect(h.timers[0]?.ms).toBe(1000)

    h.fireNextTimer()
    expect(h.sockets).toHaveLength(2)
  })

  it('tras el máximo de fallos queda sin conexión en vivo y deja de reintentar', () => {
    const h = harness()
    h.client.start()
    for (let i = 0; i < MAX_RECONNECT_ATTEMPTS; i++) {
      h.sockets.at(-1)?.drop()
      h.fireNextTimer()
    }
    h.sockets.at(-1)?.drop()

    expect(h.statuses.at(-1)).toBe('offline')
    expect(h.timers).toHaveLength(0)
  })

  it('al detenerla no reconecta', () => {
    const h = harness()
    h.client.start()
    h.sockets[0]?.open()
    h.client.stop()

    expect(h.sockets[0]?.closed).toBe(true)
    expect(h.timers).toHaveLength(0)
  })
})
