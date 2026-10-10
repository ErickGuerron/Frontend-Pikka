import { create } from 'zustand'

interface SessionState {
  token: string | null
  setToken: (token: string | null) => void
  isAuthenticated: () => boolean
}

export const useSessionStore = create<SessionState>((set, get) => ({
  token: null,
  setToken: (token) => set({ token }),
  isAuthenticated: () => get().token !== null,
}))
