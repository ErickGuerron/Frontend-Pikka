import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { apiError, mockApi, renderApp } from '@/test/utils'
import { useSession } from './session-store'

beforeEach(() => {
  useSession.getState().clear()
})

async function submitLogin(path: string, email: string, password: string) {
  const rendered = renderApp(path)
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText(/^Correo/), email)
  await user.type(screen.getByLabelText('Contraseña'), password)
  await user.click(screen.getByRole('button', { name: 'Iniciar Sesión en Pikka' }))
  return rendered
}

describe('PLAN: login with a deactivated account', () => {
  // The auth service maps ErrUserInactive to gRPC PermissionDenied; the gateway turns that into
  // 403 FORBIDDEN (api-gateway/internal/adapters/http/errors.go), body message "user is inactive".
  it('login_inactiveUser_403_showsDeactivatedMessageAndNoSession', async () => {
    const fetchMock = mockApi((url, init) => {
      if (url.endsWith('/api/v1/auth/login') && init.method === 'POST') return apiError(403, 'FORBIDDEN', 'user is inactive')
      return { status: 200, body: { status: 'ready' } }
    })
    const { router } = await submitLogin('/login', 'baja@example.com', 'Clave-segura1')

    expect(await screen.findByRole('alert')).toHaveTextContent('Tu cuenta está desactivada. Contacta a un administrador.')
    expect(useSession.getState().token).toBeNull()
    await waitFor(() => { expect(router.state.location.pathname).toBe('/login') })
    expect(fetchMock.mock.calls.some(([u]) => u.endsWith('/auth/me'))).toBe(false)
  })

  it('login_wrongCredentials_401_keepsCredentialsMessageAndNoSession', async () => {
    mockApi((url, init) => {
      if (url.endsWith('/api/v1/auth/login') && init.method === 'POST') return apiError(401, 'UNAUTHENTICATED', 'invalid credentials')
      return { status: 200, body: { status: 'ready' } }
    })
    await submitLogin('/login', 'alguien@example.com', 'mala')

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(useSession.getState().token).toBeNull()
  })
})
