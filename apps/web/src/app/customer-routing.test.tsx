import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, customerUser, driverUser, mockApi, renderApp } from '@/test/utils'

vi.mock('@/features/geo/LazyMapCanvas', () => ({ LazyMapCanvas: () => null }))

function serveAs(user: typeof customerUser) {
  return mockApi((url, init) => {
    if (url.endsWith('/api/v1/auth/login') && init.method === 'POST') {
      return { status: 200, body: { accessToken: 'tok-c', tokenType: 'Bearer', expiresIn: 3600, user } }
    }
    if (url.endsWith('/auth/me')) return { status: 200, body: user }
    if (url.endsWith('/orders/mine')) return { status: 200, body: { orders: [] } }
    return { status: 200, body: { status: 'ready' } }
  })
}

beforeEach(() => {
  useSession.getState().clear()
})

describe('enrutamiento por rol (cliente)', () => {
  it('tras iniciar sesión, el cliente aterriza en /mis-pedidos', async () => {
    serveAs(customerUser)
    const { router } = renderApp('/login')
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText(/^Correo/), 'cliente@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'cliente-password')
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión en Pikka' }))

    await waitFor(() => { expect(router.state.location.pathname).toBe('/mis-pedidos') })
    expect(await screen.findByRole('heading', { name: 'Mis Pedidos' })).toBeInTheDocument()
  })

  it('/ redirige al cliente autenticado a /mis-pedidos', async () => {
    useSession.getState().setToken('tok')
    serveAs(customerUser)
    const { router } = renderApp('/')
    await waitFor(() => { expect(router.state.location.pathname).toBe('/mis-pedidos') })
  })

  it.each(['/orders', '/users', '/zones'])('el cliente no accede a %s', async (path) => {
    useSession.getState().setToken('tok')
    serveAs(customerUser)
    const { router } = renderApp(path)
    await waitFor(() => { expect(router.state.location.pathname).toBe('/mis-pedidos') })
  })

  it('el menú del cliente solo ofrece Mis Pedidos y Cerrar sesión', async () => {
    useSession.getState().setToken('tok')
    serveAs(customerUser)
    renderApp('/mis-pedidos')
    const nav = await screen.findByRole('navigation', { name: 'Secciones' })
    expect(within(nav).getAllByRole('link').map((l) => l.textContent)).toEqual(['package_2Mis Pedidos'])
    expect(screen.getByText('Cliente', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cerrar sesión/ })).toBeInTheDocument()
  })

  it('el personal no accede a /mis-pedidos', async () => {
    useSession.getState().setToken('tok')
    serveAs(adminUser)
    const { router } = renderApp('/mis-pedidos')
    await waitFor(() => { expect(router.state.location.pathname).toBe('/') })
    expect(await screen.findByText(/No tienes acceso a Mis Pedidos/)).toBeInTheDocument()
  })

  it('el repartidor sigue viendo la indicación de la app móvil', async () => {
    useSession.getState().setToken('tok')
    serveAs(driverUser)
    const { router } = renderApp('/')
    expect(await screen.findByText('Usa la app móvil de Pikka')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })
})
