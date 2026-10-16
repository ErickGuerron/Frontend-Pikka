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

export interface SignupInput {
  email: string
  password: string
  fullName: string
  /** Normalized phone (digits with optional leading +). */
  phone: string
  city: string
}

/** Public self-registration. The server forces the CUSTOMER role and returns a session like login. */
export function signup(input: SignupInput): Promise<LoginResult> {
  return http.post('/api/v1/auth/signup', parseLogin, {
    body: { email: input.email, password: input.password, fullName: input.fullName, phone: input.phone, city: input.city },
  })
}

export function fetchCurrentUser(signal?: AbortSignal): Promise<User> {
  return http.get('/api/v1/auth/me', parseUser, signal ? { signal } : {})
}
