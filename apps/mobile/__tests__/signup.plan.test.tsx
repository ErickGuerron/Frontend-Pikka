import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
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

describe('PLAN: mobile signup with mandatory data only', () => {
  // Every field of the mobile form is mandatory today, so "mandatory-only" is the seven inputs.
  it('signup_mandatoryFieldsOnly_storesSessionAndSendsOnlyThoseFields', async () => {
    const fetchMock = mockFetch(201, session)
    await render(<SignupForm />)
    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Ana')
    await fireEvent.changeText(screen.getByLabelText('Apellido'), 'Lopez')
    await fireEvent.changeText(screen.getByLabelText('Ciudad'), 'Quito')
    await fireEvent.changeText(screen.getByLabelText('Teléfono'), '0991234567')
    await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'ana@pikka.com')
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Abcdef1!')
    await fireEvent.changeText(screen.getByLabelText('Confirmar contraseña'), 'Abcdef1!')
    await fireEvent.press(screen.getByLabelText('Crear cuenta'))

    await waitFor(() => {
      expect(useSessionStore.getState().token).toBe('tok')
    })
    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }]
    expect(Object.keys(JSON.parse(init.body) as object).sort()).toEqual(['city', 'email', 'fullName', 'password', 'phone'])
    // Generous timeout: the first render in a cold jest-expo worker exceeds the default 5 s.
  }, 60_000)

  it('signup_allFieldsEmpty_showsRequiredErrorsAndMakesNoRequest', async () => {
    const fetchMock = mockFetch(201, session)
    await render(<SignupForm />)
    await fireEvent.press(screen.getByLabelText('Crear cuenta'))

    expect(await screen.findByText('Ingresa tu nombre.')).toBeTruthy()
    expect(screen.getByText('Ingresa tu apellido.')).toBeTruthy()
    expect(screen.getByText('Ingresa tu ciudad.')).toBeTruthy()
    expect(screen.getByText('Ingresa tu número de teléfono.')).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(useSessionStore.getState().token).toBeNull()
  })
})
