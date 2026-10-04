import { http } from '@/shared/api/client'
import { number, object, string } from '@/shared/api/parse'
import { parseUser, type User } from './types'

export interface LoginResult {
  accessToken: string
  expiresIn: number
  user: User
}

function parseLogin(data: unknown): LoginResult {
  const o = object(data, 'login')
  return { accessToken: string(o, 'accessToken'), expiresIn: number(o, 'expiresIn'), user: parseUser(o.user) }
}

export function login(email: string, password: string): Promise<LoginResult> {
  return http.post('/api/v1/auth/login', parseLogin, { body: { email, password } })
}

export function fetchCurrentUser(signal?: AbortSignal): Promise<User> {
  return http.get('/api/v1/auth/me', parseUser, signal ? { signal } : {})
}
