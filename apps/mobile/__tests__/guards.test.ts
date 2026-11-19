import { decideRoute, homePathFor, isMobileRole, sectionRedirect } from '../src/features/auth/guards'

describe('route guard decisions', () => {
  it('waits until hydrated', () => {
    expect(decideRoute({ hydrated: false, token: null, role: null, group: 'app' })).toEqual({ kind: 'wait' })
  })

  it('sends anonymous users from the app group to login and lets them into auth', () => {
    expect(decideRoute({ hydrated: true, token: null, role: null, group: 'app' })).toEqual({ kind: 'redirect', href: '/login' })
    expect(decideRoute({ hydrated: true, token: null, role: null, group: 'auth' })).toEqual({ kind: 'allow' })
  })

  it('sends customers to /mis-pedidos from auth and allows the app group', () => {
    expect(decideRoute({ hydrated: true, token: 't', role: 'CUSTOMER', group: 'auth' })).toEqual({ kind: 'redirect', href: '/mis-pedidos' })
    expect(decideRoute({ hydrated: true, token: 't', role: 'CUSTOMER', group: 'app' })).toEqual({ kind: 'allow' })
  })

  it('sends drivers to /ruta from auth and allows the app group', () => {
    expect(decideRoute({ hydrated: true, token: 't', role: 'DRIVER', group: 'auth' })).toEqual({ kind: 'redirect', href: '/ruta' })
    expect(decideRoute({ hydrated: true, token: 't', role: 'DRIVER', group: 'app' })).toEqual({ kind: 'allow' })
  })

  it.each(['ADMIN', 'OPERATOR'] as const)('signs out %s sessions', (role) => {
    expect(decideRoute({ hydrated: true, token: 't', role, group: 'app' })).toEqual({ kind: 'sign-out', href: '/login' })
  })

  it('only admits customers and drivers to the mobile app', () => {
    expect(isMobileRole('CUSTOMER')).toBe(true)
    expect(isMobileRole('DRIVER')).toBe(true)
    expect(isMobileRole('ADMIN')).toBe(false)
    expect(isMobileRole('OPERATOR')).toBe(false)
  })

  it('maps each role to its home', () => {
    expect(homePathFor('CUSTOMER')).toBe('/mis-pedidos')
    expect(homePathFor('DRIVER')).toBe('/ruta')
  })

  it('keeps each role inside its own section', () => {
    expect(sectionRedirect('CUSTOMER', '/mis-pedidos')).toBeNull()
    expect(sectionRedirect('CUSTOMER', '/mis-pedidos/nuevo')).toBeNull()
    expect(sectionRedirect('CUSTOMER', '/ruta')).toBe('/mis-pedidos')
    expect(sectionRedirect('DRIVER', '/ruta')).toBeNull()
    expect(sectionRedirect('DRIVER', '/mis-pedidos')).toBe('/ruta')
    expect(sectionRedirect('DRIVER', '/otra-ruta')).toBeNull()
  })
})
