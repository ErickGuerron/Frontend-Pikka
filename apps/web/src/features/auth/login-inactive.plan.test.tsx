import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { apiError, mockApi, renderApp } from '@/test/utils'
import { useSession } from './session-store'

beforeEach(() => {
  useSession.getState().clear()
})

describe('PLAN: login with a deactivated account', () => {
  // The auth service maps ErrUserInactive to gRPC PermissionDenied; the gateway turns that into
  // 403 FORBIDDEN (api-gateway/internal/adapters/http/errors.go), body message "user is inactive".
  it('login_inactiveUser_403_staysOnLoginWithErrorAndNoSession', async () => {
    const fetchMock = mockApi((url, init) => {
      if (url.endsWith('/api/v1/auth/login') && init.method === 'POST') return apiError(403, 'FORBIDDEN', 'user is inactive')
      return { status: 200, body: { status: 'ready' } }
    })
    const { router } = renderApp('/login')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText(/^Correo/), 'baja@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Clave-segura1')
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión en Pikka' }))

    // Current behaviour: the generic FORBIDDEN message, not a dedicated "account disabled" text.
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso para esta acción.')
    expect(useSession.getState().token).toBeNull()
    await waitFor(() => { expect(router.state.location.pathname).toBe('/login') })
    expect(fetchMock.mock.calls.some(([u]) => u.endsWith('/auth/me'))).toBe(false)
  })
})
