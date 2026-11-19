import { parseStoredSession, SESSION_KEY, setSessionStorage, useSessionStore } from '../src/store/session-store'
import type { User } from '../src/features/auth/types'

const user: User = { id: 'u1', email: 'a@b.com', fullName: 'Ana Lopez', role: 'CUSTOMER', active: true, createdAt: '2026-01-01T00:00:00Z' }

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    data,
    get: (k: string) => Promise.resolve(data.get(k) ?? null),
    set: (k: string, v: string) => {
      data.set(k, v)
      return Promise.resolve()
    },
    remove: (k: string) => {
      data.delete(k)
      return Promise.resolve()
    },
  }
}

describe('session store', () => {
  let mem: ReturnType<typeof memoryStorage>
  beforeEach(() => {
    mem = memoryStorage()
    setSessionStorage(mem)
    useSessionStore.setState({ token: null, user: null, role: null, hydrated: false })
  })

  it('persists the session and exposes the role', async () => {
    await useSessionStore.getState().setSession('tok', user)
    expect(useSessionStore.getState().role).toBe('CUSTOMER')
    expect(JSON.parse(mem.data.get(SESSION_KEY) ?? '{}')).toEqual({ token: 'tok', user })
  })

  it('hydrates a stored session', async () => {
    mem.data.set(SESSION_KEY, JSON.stringify({ token: 'tok', user }))
    await useSessionStore.getState().hydrate()
    expect(useSessionStore.getState()).toMatchObject({ token: 'tok', hydrated: true, role: 'CUSTOMER' })
  })

  it('hydrates to logged out on empty or corrupt storage', async () => {
    mem.data.set(SESSION_KEY, '{not json')
    await useSessionStore.getState().hydrate()
    expect(useSessionStore.getState()).toMatchObject({ token: null, hydrated: true })
    expect(parseStoredSession(JSON.stringify({ token: 't', user: { id: 1 } }))).toBeNull()
  })

  it('clear removes the persisted session', async () => {
    await useSessionStore.getState().setSession('tok', user)
    await useSessionStore.getState().clear()
    expect(mem.data.has(SESSION_KEY)).toBe(false)
    expect(useSessionStore.getState().token).toBeNull()
  })
})
