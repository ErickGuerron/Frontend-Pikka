import { boolean, object, oneOf, string } from '@/shared/api/parse'

export const roles = ['ADMIN', 'OPERATOR', 'DRIVER', 'CUSTOMER'] as const
export type Role = (typeof roles)[number]

/** Roles a back-office admin can assign (CUSTOMER only comes from self sign-up). */
export const assignableRoles = ['ADMIN', 'OPERATOR', 'DRIVER'] as const

export const roleLabels: Record<Role, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
  DRIVER: 'Repartidor',
  CUSTOMER: 'Cliente',
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
