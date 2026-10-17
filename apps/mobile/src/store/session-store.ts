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
  /** `expiresInSeconds` comes from the login response; without it the session has no client-side expiry. */
  setSession: (token: string, user: User, expiresInSeconds?: number) => Promise<void>
  updateUser: (partial: Partial<User>) => Promise<void>
  clear: () => Promise<void>
  hydrate: () => Promise<void>
}

let storage: KeyValueStorage = secureStorage

/** Test seam: swap the persistence backend. */
export function setSessionStorage(next: KeyValueStorage): void {
  storage = next
}

/** A session whose expiry instant has passed must not be used, even if it is still stored. */
export function isSessionExpired(expiresAt: number | undefined, now: number): boolean {
  return expiresAt !== undefined && now >= expiresAt
}

/** Parses the persisted JSON; anything malformed means "no session". */
export function parseStoredSession(raw: string | null): { token: string; user: User; expiresAt?: number } | null {
  if (raw === null) return null
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null || !('token' in data) || !('user' in data)) return null
    if (typeof data.token !== 'string' || data.token === '') return null
    const expiresAt = 'expiresAt' in data && typeof data.expiresAt === 'number' ? data.expiresAt : undefined
    return { token: data.token, user: parseUser(data.user), expiresAt }
  } catch {
    return null
  }
}

export const useSessionStore = create<SessionState>((set) => ({
  token: null,
  user: null,
  role: null,
  hydrated: false,
  setSession: async (token, user, expiresInSeconds) => {
    const expiresAt = expiresInSeconds === undefined ? undefined : Date.now() + expiresInSeconds * 1000
    set({ token, user, role: user.role, hydrated: true })
    await storage.set(SESSION_KEY, JSON.stringify({ token, user, expiresAt }))
  },
  updateUser: async (partial) => {
    const current = useSessionStore.getState()
    if (!current.user) return
    const updatedUser: User = { ...current.user, ...partial }
    set({ user: updatedUser })
    const stored = parseStoredSession(await storage.get(SESSION_KEY))
    if (stored) {
      await storage.set(
        SESSION_KEY,
        JSON.stringify({ token: stored.token, user: updatedUser, expiresAt: stored.expiresAt })
      )
    }
  },
  clear: async () => {
    set({ token: null, user: null, role: null })
    await storage.remove(SESSION_KEY)
  },
  hydrate: async () => {
    const stored = parseStoredSession(await storage.get(SESSION_KEY))
    if (stored && !isSessionExpired(stored.expiresAt, Date.now())) {
      set({ token: stored.token, user: stored.user, role: stored.user.role, hydrated: true })
      return
    }
    // Expired sessions are removed here, so the next launch does not even read them, and
    // any session still held in memory is dropped too.
    if (stored) await storage.remove(SESSION_KEY)
    set({ token: null, user: null, role: null, hydrated: true })
  },
}))
