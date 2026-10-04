import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface SessionState {
  token: string | null
  setToken: (token: string) => void
  clear: () => void
}

// Solo el token vive aquí; los datos del usuario los administra TanStack Query
// (sección 22: no se duplica en Zustand lo que ya viene del servidor).
// sessionStorage: la sesión no sobrevive al cierre de la pestaña.
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => {
        set({ token })
      },
      clear: () => {
        set({ token: null })
      },
    }),
    { name: 'pikka-session', storage: createJSONStorage(() => sessionStorage) },
  ),
)
