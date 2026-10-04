import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { adminUser, apiError, driverUser, mockApi, renderApp, sentBody } from '@/test/utils'
import { useSession } from './session-store'

beforeEach(() => {
  useSession.getState().clear()
})

describe('login', () => {
  it('redirige a /login si no hay sesión', async () => {
    mockApi(() => ({ status: 200, body: {} }))
    const { router } = renderApp('/orders')
    await waitFor(() => { expect(router.state.location.pathname).toBe('/login') })
  })

  it('inicia sesión y vuelve a la página pedida', async () => {
    const fetchMock = mockApi((url, init) => {
      if (url.endsWith('/api/v1/auth/login') && init.method === 'POST') {
        return { status: 200, body: { accessToken: 'tok-123', tokenType: 'Bearer', expiresIn: 3600, user: adminUser } }
      }
      if (url.endsWith('/api/v1/auth/me')) return { status: 200, body: adminUser }
      return { status: 200, body: { status: 'ready' } }
    })
    const { router } = renderApp('/orders')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Correo'), ' admin@example.com ')
    await user.type(screen.getByLabelText('Contraseña'), 'admin-password')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => { expect(router.state.location.pathname).toBe('/orders') })
    expect(useSession.getState().token).toBe('tok-123')
    expect(await screen.findByText('Ana Admin')).toBeInTheDocument()
    const loginCall = fetchMock.mock.calls.find(([u]) => u.endsWith('/auth/login'))
    expect(sentBody(loginCall?.[1])).toEqual({ email: 'admin@example.com', password: 'admin-password' })
  })

  it('muestra el error de credenciales', async () => {
    mockApi(() => apiError(401, 'UNAUTHENTICATED', 'invalid credentials'))
    renderApp('/login')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Correo'), 'admin@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'mala')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(useSession.getState().token).toBeNull()
  })

  it('cierra la sesión si el token vence', async () => {
    useSession.getState().setToken('expired')
    mockApi(() => apiError(401, 'UNAUTHENTICATED'))
    const { router } = renderApp('/')
    await waitFor(() => { expect(router.state.location.pathname).toBe('/login') })
    expect(useSession.getState().token).toBeNull()
  })

  it('cerrar sesión borra el token', async () => {
    useSession.getState().setToken('tok')
    mockApi((url) => (url.endsWith('/auth/me') ? { status: 200, body: adminUser } : { status: 200, body: { status: 'ready' } }))
    const { router } = renderApp('/')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))
    await waitFor(() => { expect(router.state.location.pathname).toBe('/login') })
    expect(useSession.getState().token).toBeNull()
  })
})

describe('navegación por rol', () => {
  it('solo ADMIN ve la sección Usuarios', async () => {
    useSession.getState().setToken('tok')
    mockApi((url) => (url.endsWith('/auth/me') ? { status: 200, body: driverUser } : { status: 200, body: { status: 'ready' } }))
    renderApp('/users/new')

    expect(await screen.findByText('Sin acceso')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument()
  })
})
