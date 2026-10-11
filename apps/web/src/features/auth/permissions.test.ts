import { describe, expect, it } from 'vitest'
import { canAccess, hasWebAccess, sections, type Section } from './permissions'
import type { Role } from './types'

const expectedAccess: Record<Role, Section[]> = {
  ADMIN: [...sections],
  OPERATOR: ['home', 'orders', 'zones', 'routes', 'drivers', 'tracking'],
  DRIVER: [],
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

  it('solo el personal tiene acceso web', () => {
    expect(hasWebAccess('ADMIN')).toBe(true)
    expect(hasWebAccess('OPERATOR')).toBe(true)
    expect(hasWebAccess('DRIVER')).toBe(false)
    expect(hasWebAccess(undefined)).toBe(false)
  })
})
