import type { User } from '../src/features/auth/types'
import type { KeyValueStorage } from '../src/store/secure-storage'
import { isSessionExpired, SESSION_KEY, setSessionStorage, useSessionStore } from '../src/store/session-store'

const user: User = {
  id: 'u-1',
  email: 'ana@pikka.com',
  fullName: 'Ana Ruiz',
  role: 'CUSTOMER',
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
}

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return {
    data,
    get: async (key: string) => data.get(key) ?? null,
    set: async (key: string, value: string) => {
      data.set(key, value)
    },
    remove: async (key: string) => {
      data.delete(key)
    },
  }
}

describe('isSessionExpired', () => {
  it('is false without an expiry, and before and at the expiry instant only as expected', () => {
    expect(isSessionExpired(undefined, 10)).toBe(false)
    expect(isSessionExpired(100, 99)).toBe(false)
    expect(isSessionExpired(100, 100)).toBe(true)
    expect(isSessionExpired(100, 101)).toBe(true)
  })
})

describe('session expiry on hydrate', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('stores the expiry computed from expiresIn at login', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-14T10:00:00Z'))
    const storage = memoryStorage()
    setSessionStorage(storage)

    await useSessionStore.getState().setSession('tok', user, 3600)

    const stored = JSON.parse(storage.data.get(SESSION_KEY) ?? '{}') as { expiresAt?: number }
    expect(stored.expiresAt).toBe(new Date('2026-10-14T11:00:00Z').getTime())
  })

  it('restores a session that has not expired yet', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-14T10:30:00Z'))
    const expiresAt = new Date('2026-10-14T11:00:00Z').getTime()
    setSessionStorage(memoryStorage({ [SESSION_KEY]: JSON.stringify({ token: 'tok', user, expiresAt }) }))

    await useSessionStore.getState().hydrate()

    expect(useSessionStore.getState().token).toBe('tok')
  })

  it('drops and removes a session whose expiry has passed', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-14T12:00:00Z'))
    const expiresAt = new Date('2026-10-14T11:00:00Z').getTime()
    const storage = memoryStorage({ [SESSION_KEY]: JSON.stringify({ token: 'tok', user, expiresAt }) })
    setSessionStorage(storage)

    await useSessionStore.getState().hydrate()

    expect(useSessionStore.getState().token).toBeNull()
    expect(useSessionStore.getState().hydrated).toBe(true)
    expect(storage.data.has(SESSION_KEY)).toBe(false)
  })

  it('keeps a session stored without expiry, for sessions saved before this change', async () => {
    setSessionStorage(memoryStorage({ [SESSION_KEY]: JSON.stringify({ token: 'old', user }) }))

    await useSessionStore.getState().hydrate()

    expect(useSessionStore.getState().token).toBe('old')
  })
})
