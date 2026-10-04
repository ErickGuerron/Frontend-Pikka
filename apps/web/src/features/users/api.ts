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
