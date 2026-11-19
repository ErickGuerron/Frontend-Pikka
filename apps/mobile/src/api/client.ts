import { API_BASE_URL } from './config'
import { createHttpClient } from './http'
import { useSessionStore } from '../store/session-store'

/** Shared client: sends the stored token and clears the session on a 401. */
export const http = createHttpClient({
  baseUrl: API_BASE_URL,
  getToken: () => useSessionStore.getState().token,
  onUnauthorized: () => {
    void useSessionStore.getState().clear()
  },
})
