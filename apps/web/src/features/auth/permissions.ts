import type { Role } from './types'

/**
 * Secciones de la web y roles que pueden verlas (ADR 0008 del backend).
 * Esto solo controla la navegación y las consultas. La autorización real la
 * aplica cada servicio en la API.
 */
export const sections = ['home', 'orders', 'exceptions', 'zones', 'routes', 'drivers', 'tracking', 'users', 'products', 'myOrders', 'catalog', 'newDriver'] as const
export type Section = (typeof sections)[number]

export const sectionLabels: Record<Section, string> = {
  home: 'Inicio',
  orders: 'Pedidos',
  exceptions: 'Excepciones',
  zones: 'Zonas',
  routes: 'Rutas',
  drivers: 'Repartidores',
  tracking: 'Seguimiento',
  users: 'Usuarios',
  products: 'Productos',
  myOrders: 'Mis Pedidos',
  catalog: 'Catálogo',
  newDriver: 'Nuevo repartidor',
}

const staffRoles: readonly Role[] = ['ADMIN', 'OPERATOR']

const allowedRoles: Record<Section, readonly Role[]> = {
  home: staffRoles,
  orders: staffRoles,
  exceptions: staffRoles,
  zones: staffRoles,
  routes: staffRoles,
  drivers: staffRoles,
  tracking: staffRoles,
  users: ['ADMIN'],
  products: staffRoles,
  // The customer area is exclusive to customers; staff use the back-office sections.
  myOrders: ['CUSTOMER'],
  catalog: ['CUSTOMER'],
  newDriver: ['ADMIN'],
}

export function canAccess(role: Role | undefined, section: Section): boolean {
  return role !== undefined && allowedRoles[section].includes(role)
}

/** Customer landing page after signing in. */
export const customerHomePath = '/mis-pedidos'

/** Staff and customers use the web; a driver works in the mobile app (ADR 0007). */
export function hasWebAccess(role: Role | undefined): boolean {
  return canAccess(role, 'home') || canAccess(role, 'myOrders')
}

/** Where a signed-in user lands: customers go to their orders, everyone else to the dashboard. */
export function homePathFor(role: Role | undefined): string {
  return canAccess(role, 'myOrders') ? customerHomePath : '/'
}
