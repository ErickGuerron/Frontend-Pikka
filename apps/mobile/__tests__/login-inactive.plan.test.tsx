import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { LoginForm } from '../src/features/auth/LoginForm'
import { setSessionStorage, useSessionStore } from '../src/store/session-store'

function mockFetch(status: number, body: unknown) {
  const fn = jest.fn().mockResolvedValue({ ok: status < 400, status, json: () => Promise.resolve(body) })
  globalThis.fetch = fn as unknown as typeof fetch
  return fn
}

beforeEach(() => {
  setSessionStorage({ get: () => Promise.resolve(null), set: () => Promise.resolve(), remove: () => Promise.resolve() })
  useSessionStore.setState({ token: null, user: null, role: null, hydrated: true })
})

async function submit(email: string, password: string) {
  await render(<LoginForm />)
  await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), email)
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), password)
  await fireEvent.press(screen.getByLabelText('Iniciar sesión'))
}

describe('PLAN: mobile login with a deactivated account', () => {
  // Gateway answers a deactivated account with 403 FORBIDDEN, body message "user is inactive".
  it('login_inactiveUser_403_showsDeactivatedMessageAndStoresNoSession', async () => {
    mockFetch(403, { error: { code: 'FORBIDDEN', message: 'user is inactive' } })
    await submit('baja@pikka.com', 'Clave-segura1')

    expect(await screen.findByText('Tu cuenta está desactivada. Contacta a un administrador.')).toBeTruthy()
    expect(useSessionStore.getState().token).toBeNull()
    // Generous timeout: the first render in a cold jest-expo worker exceeds the default 5 s.
  }, 60_000)

  it('login_wrongCredentials_401_keepsCredentialsMessageAndStoresNoSession', async () => {
    mockFetch(401, { error: { code: 'UNAUTHENTICATED', message: 'invalid credentials' } })
    await submit('alguien@pikka.com', 'mala')

    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeTruthy()
    await waitFor(() => { expect(useSessionStore.getState().token).toBeNull() })
  })
})
