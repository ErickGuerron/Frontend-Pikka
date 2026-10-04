import { boolean, object, oneOf, string } from '@/shared/api/parse'

export const roles = ['ADMIN', 'OPERATOR', 'DRIVER'] as const
export type Role = (typeof roles)[number]

export const roleLabels: Record<Role, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
  DRIVER: 'Repartidor',
}

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  active: boolean
  createdAt: string
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
  }
}
