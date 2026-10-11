import { decideRoute } from '../src/features/auth/guards'

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

  it.each(['ADMIN', 'OPERATOR', 'DRIVER'] as const)('signs out %s sessions', (role) => {
    expect(decideRoute({ hydrated: true, token: 't', role, group: 'app' })).toEqual({ kind: 'sign-out', href: '/login' })
  })
})
