import type { Role } from './types'

export type RouteGroup = 'auth' | 'app'

export type RouteDecision =
  | { kind: 'wait' }
  | { kind: 'allow' }
  | { kind: 'redirect'; href: '/login' | '/mis-pedidos' }
  /** Session of a non-customer role on this customers-only build: end it and go to login. */
  | { kind: 'sign-out'; href: '/login' }

export const CUSTOMER_HOME = '/mis-pedidos'

export interface GuardInput {
  hydrated: boolean
  token: string | null
  role: Role | null
  group: RouteGroup
}

/** Pure routing decision for the (auth) and (app) route groups. */
export function decideRoute({ hydrated, token, role, group }: GuardInput): RouteDecision {
  if (!hydrated) return { kind: 'wait' }
  if (token === null || role === null) {
    return group === 'auth' ? { kind: 'allow' } : { kind: 'redirect', href: '/login' }
  }
  if (role !== 'CUSTOMER') return { kind: 'sign-out', href: '/login' }
  return group === 'auth' ? { kind: 'redirect', href: CUSTOMER_HOME } : { kind: 'allow' }
}

export const NON_CUSTOMER_MESSAGE =
  'Esta versión de la app es solo para clientes. El personal de Pikka debe usar el panel web.'

/** Whether a freshly authenticated user may keep a session on this build. */
export function isCustomerRole(role: Role): boolean {
  return role === 'CUSTOMER'
}
