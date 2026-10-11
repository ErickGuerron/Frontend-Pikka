import type { Role } from './types'

/**
 * Secciones de la web y roles que pueden verlas (ADR 0008 del backend).
 * Esto solo controla la navegación y las consultas. La autorización real la
 * aplica cada servicio en la API.
 */
export const sections = ['home', 'orders', 'zones', 'routes', 'drivers', 'tracking', 'users'] as const
export type Section = (typeof sections)[number]

export const sectionLabels: Record<Section, string> = {
  home: 'Inicio',
  orders: 'Pedidos',
  zones: 'Zonas',
  routes: 'Rutas',
  drivers: 'Repartidores',
  tracking: 'Seguimiento',
  users: 'Usuarios',
}

const staffRoles: readonly Role[] = ['ADMIN', 'OPERATOR']

const allowedRoles: Record<Section, readonly Role[]> = {
  home: staffRoles,
  orders: staffRoles,
  zones: staffRoles,
  routes: staffRoles,
  drivers: staffRoles,
  tracking: staffRoles,
  users: ['ADMIN'],
}

export function canAccess(role: Role | undefined, section: Section): boolean {
  return role !== undefined && allowedRoles[section].includes(role)
}

/** Un repartidor no usa la web: su trabajo está en la app móvil (ADR 0007). */
export function hasWebAccess(role: Role | undefined): boolean {
  return canAccess(role, 'home')
}
