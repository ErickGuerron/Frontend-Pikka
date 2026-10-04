import { useSession } from '@/features/auth/session-store'
import { apiBaseUrl } from '@/shared/config/env'
import { createHttpClient } from './http'

export const http = createHttpClient({
  baseUrl: apiBaseUrl,
  getToken: () => useSession.getState().token,
  onUnauthorized: () => {
    useSession.getState().clear()
  },
})
