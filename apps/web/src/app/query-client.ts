import { QueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/session-store'
import { ApiError } from '@/shared/api/errors'

/**
 * Descarta la caché cuando la sesión pasa de tener token a no tenerla, sea por
 * logout o por un 401. Sin esto, el siguiente usuario vería datos del anterior
 * (pedidos, perfil) mientras se recargan. Devuelve la función para dejar de escuchar.
 */
export function clearCacheOnSignOut(client: QueryClient): () => void {
  return useSession.subscribe((state, previous) => {
    if (previous.token !== null && state.token === null) {
      client.clear()
    }
  })
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Reintentar un 4xx no cambia el resultado.
        retry: (failureCount, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
        refetchOnWindowFocus: true,
      },
    },
  })
}
