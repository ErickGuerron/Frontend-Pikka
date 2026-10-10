import { createHttpClient, type HttpClient } from './http'
import { useSessionStore } from '../store/session-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'

function createAuthClient(): HttpClient {
  return createHttpClient({
    baseUrl: API_URL,
    getToken: () => useSessionStore.getState().token,
    onUnauthorized: () => useSessionStore.getState().setToken(null),
  })
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    role: string
    name: string
  }
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const client = createAuthClient()
    return client.post<LoginResponse>(
      '/auth/login',
      (data) => data as LoginResponse,
      { body: { email, password } }
    )
  },
}
