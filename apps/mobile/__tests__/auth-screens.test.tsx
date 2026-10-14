import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { LoginForm } from '../src/features/auth/LoginForm'
import { SignupForm } from '../src/features/auth/SignupForm'
import { setSessionStorage, useSessionStore } from '../src/store/session-store'

const user = { id: 'u1', email: 'a@b.com', fullName: 'Ana Lopez', role: 'CUSTOMER', active: true, createdAt: '2026-01-01T00:00:00Z' }
const session = { accessToken: 'tok', tokenType: 'Bearer', expiresIn: 3600, user }

function mockFetch(status: number, body: unknown) {
  const fn = jest.fn().mockResolvedValue({ ok: status < 400, status, json: () => Promise.resolve(body) })
  globalThis.fetch = fn as unknown as typeof fetch
  return fn
}

beforeEach(() => {
  setSessionStorage({ get: () => Promise.resolve(null), set: () => Promise.resolve(), remove: () => Promise.resolve() })
  useSessionStore.setState({ token: null, user: null, role: null, hydrated: true })
})

async function fillSignup(password: string) {
  await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Ana')
  await fireEvent.changeText(screen.getByLabelText('Apellido'), 'Lopez')
  await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'ana@pikka.com')
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), password)
  await fireEvent.changeText(screen.getByLabelText('Confirmar contraseña'), password)
}

describe('SignupForm', () => {
  it('shows the missing rules and does not call the API for a weak password', async () => {
    const fetchMock = mockFetch(201, session)
    await render(<SignupForm />)
    await fillSignup('abc')
    await fireEvent.press(screen.getByLabelText('Crear cuenta'))
    expect(await screen.findByText(/^Falta: /)).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not show a password checklist before submitting', async () => {
    await render(<SignupForm />)
    expect(screen.queryByText(/Falta:/)).toBeNull()
  })

  it('stores the session on success and sends the joined full name', async () => {
    const fetchMock = mockFetch(201, session)
    await render(<SignupForm />)
    await fillSignup('Abcdef1!')
    await fireEvent.press(screen.getByLabelText('Crear cuenta'))
    await waitFor(() => {
      expect(useSessionStore.getState().token).toBe('tok')
    })
    const [url, init] = fetchMock.mock.calls[0] as [string, { body: string }]
    expect(url).toMatch(/\/api\/v1\/auth\/signup$/)
    expect(JSON.parse(init.body)).toEqual({ email: 'ana@pikka.com', password: 'Abcdef1!', fullName: 'Ana Lopez' })
  })

  it('maps 409 to the duplicate-record message', async () => {
    mockFetch(409, { error: { code: 'CONFLICT', message: 'dup' } })
    await render(<SignupForm />)
    await fillSignup('Abcdef1!')
    await fireEvent.press(screen.getByLabelText('Crear cuenta'))
    expect(await screen.findByText('Ya existe un registro con esos datos.')).toBeTruthy()
    expect(useSessionStore.getState().token).toBeNull()
  })
})

describe('LoginForm', () => {
  it('has no role selector or staff credential elements', async () => {
    await render(<LoginForm />)
    for (const text of ['Despacho', 'Conductor', 'Admin', 'Escanear gafete', 'Pikka Token ID']) {
      expect(screen.queryByText(new RegExp(text, 'i'))).toBeNull()
    }
  })

  it('does not keep a session for staff roles', async () => {
    mockFetch(200, { ...session, user: { ...user, role: 'ADMIN' } })
    await render(<LoginForm />)
    await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'a@pikka.com')
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'whatever')
    await fireEvent.press(screen.getByLabelText('Iniciar sesión'))
    expect(await screen.findByText(/panel web/)).toBeTruthy()
    expect(useSessionStore.getState().token).toBeNull()
  })

  it('stores the session for drivers', async () => {
    mockFetch(200, { ...session, user: { ...user, role: 'DRIVER' } })
    await render(<LoginForm />)
    await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'd@pikka.com')
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'whatever')
    await fireEvent.press(screen.getByLabelText('Iniciar sesión'))
    await waitFor(() => expect(useSessionStore.getState().role).toBe('DRIVER'))
  })

  it('stores the session for customers', async () => {
    mockFetch(200, session)
    await render(<LoginForm />)
    await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'ana@pikka.com')
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'whatever')
    await fireEvent.press(screen.getByLabelText('Iniciar sesión'))
    await waitFor(() => {
      expect(useSessionStore.getState().role).toBe('CUSTOMER')
    })
  })
})
