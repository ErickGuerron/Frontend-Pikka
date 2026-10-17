import { boolean, number, object, oneOf, string } from '../../api/parse'

export const roles = ['ADMIN', 'OPERATOR', 'DRIVER', 'CUSTOMER'] as const
export type Role = (typeof roles)[number]

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  active: boolean
  createdAt: string
  phone?: string
  city?: string
}

export function parseUser(data: unknown): User {
  const o = object(data, 'user')
  return {
    id: string(o, 'id'),
    email: string(o, 'email'),
    fullName: string(o, 'fullName'),
    role: oneOf(o, 'role', roles),
    active: boolean(o, 'active'),
    createdAt: string(o, 'createdAt'),
    phone: typeof o.phone === 'string' ? o.phone : undefined,
    city: typeof o.city === 'string' ? o.city : undefined,
  }
}

export interface AuthResult {
  accessToken: string
  expiresIn: number
  user: User
}

export function parseAuthResult(data: unknown): AuthResult {
  const o = object(data, 'auth')
  return { accessToken: string(o, 'accessToken'), expiresIn: number(o, 'expiresIn'), user: parseUser(o.user) }
}
