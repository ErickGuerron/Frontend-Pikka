import type { Role } from './types'

export type RouteGroup = 'auth' | 'app'

export type MobileHome = '/mis-pedidos' | '/ruta'

export type RouteDecision =
  | { kind: 'wait' }
  | { kind: 'allow' }
  | { kind: 'redirect'; href: '/login' | MobileHome }
  /** Session of a role this app does not serve: end it and go to login. */
  | { kind: 'sign-out'; href: '/login' }

/** ADR 0007: one mobile app serves CUSTOMER and DRIVER. Staff use the web panel. */
export const MOBILE_ROLES: readonly Role[] = ['CUSTOMER', 'DRIVER']

export const CUSTOMER_HOME: MobileHome = '/mis-pedidos'
export const DRIVER_HOME: MobileHome = '/ruta'

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
  if (!isMobileRole(role)) return { kind: 'sign-out', href: '/login' }
  return group === 'auth' ? { kind: 'redirect', href: homePathFor(role) } : { kind: 'allow' }
}

/** Landing section of each mobile role. */
export function homePathFor(role: Role): MobileHome {
  return role === 'DRIVER' ? DRIVER_HOME : CUSTOMER_HOME
}

/**
 * Section check inside the (app) group: a customer may not open the driver route and a
 * driver may not open the customer orders. Returns the href to send them to, or null.
 */
export function sectionRedirect(role: Role, pathname: string): MobileHome | null {
  const section = sectionOf(pathname)
  if (section === null || section === role) return null
  return homePathFor(role)
}

function sectionOf(pathname: string): Role | null {
  if (pathname === '/mis-pedidos' || pathname.startsWith('/mis-pedidos/')) return 'CUSTOMER'
  if (pathname === '/ruta' || pathname.startsWith('/ruta/')) return 'DRIVER'
  return null
}

export const NON_MOBILE_MESSAGE =
  'Esta app es para clientes y repartidores. El personal de Pikka debe usar el panel web.'

/** Whether a freshly authenticated user may keep a session on this build. */
export function isMobileRole(role: Role): boolean {
  return MOBILE_ROLES.includes(role)
}
