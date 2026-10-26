import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryClient } from '@/app/query-client'
import { mockApi, sentBody } from '@/test/utils'
import { SignupForm } from './SignupForm'
import { useSession } from './session-store'

const customer = {
  id: '33333333-3333-3333-3333-333333333333',
  email: 'cliente@example.com',
  fullName: 'Carla Cliente',
  role: 'CUSTOMER',
  active: true,
  createdAt: '2026-10-11T00:00:00Z',
}

function renderForm() {
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({ queries: { retry: false } })
  const onSuccess = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <SignupForm onSuccess={onSuccess} />
    </QueryClientProvider>,
  )
  return { onSuccess, user: userEvent.setup() }
}

const submit = () => screen.getByRole('button', { name: 'Crear cuenta' })

beforeEach(() => {
  useSession.getState().clear()
})

describe('PLAN: signup with mandatory data only', () => {
  // In the current web form every field (name, surname, city, phone, email, password, confirmation)
  // is mandatory, so "mandatory-only" means exactly these seven inputs and nothing else.
  it('signup_mandatoryFieldsOnly_createsAccountAndSendsOnlyThoseFields', async () => {
    const fetchMock = mockApi(() => ({
      status: 201,
      body: { accessToken: 'tok-min', tokenType: 'Bearer', expiresIn: 3600, user: customer },
    }))
    const { user, onSuccess } = renderForm()

    await user.type(screen.getByLabelText('Nombre'), 'Carla')
    await user.type(screen.getByLabelText('Apellido'), 'Cliente')
    await user.type(screen.getByLabelText('Ciudad'), 'Quito')
    await user.type(screen.getByLabelText('Teléfono'), '0991234567')
    await user.type(screen.getByLabelText(/^Correo/), 'cliente@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Clave-segura1')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Clave-segura1')
    await user.click(submit())

    await waitFor(() => { expect(onSuccess).toHaveBeenCalledTimes(1) })
    expect(useSession.getState().token).toBe('tok-min')
    expect(Object.keys(sentBody(fetchMock.mock.calls[0]?.[1]) as object).sort()).toEqual(['city', 'email', 'fullName', 'password', 'phone'])
  })
})

describe('PLAN: signup with an empty form', () => {
  it('signup_allFieldsEmpty_showsRequiredErrorsAndMakesNoRequest', async () => {
    const fetchMock = mockApi(() => ({ status: 201, body: {} }))
    const { user, onSuccess } = renderForm()

    await user.click(submit())

    expect(await screen.findByText('Ingresa tu nombre.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu apellido.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu ciudad.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu número de teléfono.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu correo electrónico.')).toBeInTheDocument()
    expect(screen.getByText(/^Falta: /)).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(useSession.getState().token).toBeNull()
  })
})
