import { http } from '../../api/client'
import { parseAuthResult, parseUser, type AuthResult, type User } from './types'

export function login(email: string, password: string): Promise<AuthResult> {
  return http.post('/api/v1/auth/login', parseAuthResult, { body: { email, password } })
}

export interface SignupInput {
  email: string
  password: string
  fullName: string
}

/** Public self-registration: the server forces the CUSTOMER role and returns a session like login. */
export function signup(input: SignupInput): Promise<AuthResult> {
  return http.post('/api/v1/auth/signup', parseAuthResult, {
    body: { email: input.email, password: input.password, fullName: input.fullName },
  })
}

export function fetchCurrentUser(signal?: AbortSignal): Promise<User> {
  return http.get('/api/v1/auth/me', parseUser, signal ? { signal } : {})
}
