import { create } from 'zustand'
import { parseUser, type Role, type User } from '../features/auth/types'
import { secureStorage, type KeyValueStorage } from './secure-storage'

export const SESSION_KEY = 'pikka.session'

interface SessionState {
  token: string | null
  user: User | null
  role: Role | null
  /** True once the persisted session was read, so routing never flashes the wrong screen. */
  hydrated: boolean
  setSession: (token: string, user: User) => Promise<void>
  clear: () => Promise<void>
  hydrate: () => Promise<void>
}

let storage: KeyValueStorage = secureStorage

/** Test seam: swap the persistence backend. */
export function setSessionStorage(next: KeyValueStorage): void {
  storage = next
}

/** Parses the persisted JSON; anything malformed means "no session". */
export function parseStoredSession(raw: string | null): { token: string; user: User } | null {
  if (raw === null) return null
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null || !('token' in data) || !('user' in data)) return null
    if (typeof data.token !== 'string' || data.token === '') return null
    return { token: data.token, user: parseUser(data.user) }
  } catch {
    return null
  }
}

export const useSessionStore = create<SessionState>((set) => ({
  token: null,
  user: null,
  role: null,
  hydrated: false,
  setSession: async (token, user) => {
    set({ token, user, role: user.role, hydrated: true })
    await storage.set(SESSION_KEY, JSON.stringify({ token, user }))
  },
  clear: async () => {
    set({ token: null, user: null, role: null })
    await storage.remove(SESSION_KEY)
  },
  hydrate: async () => {
    const stored = parseStoredSession(await storage.get(SESSION_KEY))
    if (stored) set({ token: stored.token, user: stored.user, role: stored.user.role, hydrated: true })
    else set({ hydrated: true })
  },
}))
