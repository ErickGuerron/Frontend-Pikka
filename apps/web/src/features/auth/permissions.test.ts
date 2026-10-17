import { describe, expect, it } from 'vitest'
import { canAccess, hasWebAccess, homePathFor, sections, type Section } from './permissions'
import type { Role } from './types'

const expectedAccess: Record<Role, Section[]> = {
  ADMIN: ['home', 'orders', 'exceptions', 'zones', 'routes', 'drivers', 'tracking', 'users', 'products', 'newDriver'],
  OPERATOR: ['home', 'orders', 'exceptions', 'zones', 'routes', 'drivers', 'tracking', 'products'],
  DRIVER: [],
  CUSTOMER: ['myOrders', 'catalog'],
}

describe('matriz de permisos de la web (ADR 0008)', () => {
  for (const role of Object.keys(expectedAccess) as Role[]) {
    it(`${role} accede exactamente a sus secciones`, () => {
      const allowed = sections.filter((section) => canAccess(role, section))
      expect(allowed).toEqual(expectedAccess[role])
    })
  }

  it('sin usuario no hay acceso a ninguna sección', () => {
    expect(sections.some((section) => canAccess(undefined, section))).toBe(false)
  })

  it('el personal y los clientes tienen acceso web; el repartidor no', () => {
    expect(hasWebAccess('ADMIN')).toBe(true)
    expect(hasWebAccess('OPERATOR')).toBe(true)
    expect(hasWebAccess('CUSTOMER')).toBe(true)
    expect(hasWebAccess('DRIVER')).toBe(false)
    expect(hasWebAccess(undefined)).toBe(false)
  })

  it('el cliente no accede a ninguna sección del personal', () => {
    for (const section of sections.filter((s) => s !== 'myOrders' && s !== 'catalog')) {
      expect(canAccess('CUSTOMER', section)).toBe(false)
    }
  })

  it('el catálogo del cliente y la administración de productos no se cruzan', () => {
    expect(canAccess('CUSTOMER', 'products')).toBe(false)
    expect(canAccess('OPERATOR', 'catalog')).toBe(false)
    expect(canAccess('ADMIN', 'catalog')).toBe(false)
    expect(canAccess('DRIVER', 'products')).toBe(false)
  })

  it('el personal no accede a Mis Pedidos', () => {
    expect(canAccess('ADMIN', 'myOrders')).toBe(false)
    expect(canAccess('OPERATOR', 'myOrders')).toBe(false)
    expect(canAccess('DRIVER', 'myOrders')).toBe(false)
  })

  it('cada rol aterriza en su página de inicio', () => {
    expect(homePathFor('CUSTOMER')).toBe('/mis-pedidos')
    expect(homePathFor('ADMIN')).toBe('/')
    expect(homePathFor('OPERATOR')).toBe('/')
    expect(homePathFor('DRIVER')).toBe('/')
    expect(homePathFor(undefined)).toBe('/')
  })
})
