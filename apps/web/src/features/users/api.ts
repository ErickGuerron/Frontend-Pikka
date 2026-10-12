import { parseUser, type Role, type User } from '@/features/auth/types'
import { http } from '@/shared/api/client'

export interface NewUser {
  email: string
  password: string
  fullName: string
  role: Role
}

export function createUser(input: NewUser): Promise<User> {
  return http.post('/api/v1/users', parseUser, { body: input })
}

/** El gateway responde `{ users: [...] }`; se acepta también un array plano. */
function parseUsers(data: unknown): User[] {
  const list = Array.isArray(data) ? data : (data as { users?: unknown } | null)?.users
  if (!Array.isArray(list)) return []
  return list.map((item) => parseUser(item))
}

export function getUsers(): Promise<User[]> {
  return http.get('/api/v1/users', parseUsers)
}
