import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryClient } from '@/app/query-client'
import { apiError, mockApi, sentBody } from '@/test/utils'
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

const strongPassword = 'Clave-segura1'

function renderForm(onSuccess = vi.fn()) {
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({ queries: { retry: false } })
  render(
    <QueryClientProvider client={queryClient}>
      <SignupForm onSuccess={onSuccess} />
    </QueryClientProvider>,
  )
  return { onSuccess, user: userEvent.setup() }
}

interface FormValues {
  nombre?: string
  apellido?: string
  email?: string
  password?: string
  confirm?: string
}

async function fill(user: ReturnType<typeof userEvent.setup>, values: FormValues) {
  if (values.nombre !== undefined) await user.type(screen.getByLabelText('Nombre'), values.nombre)
  if (values.apellido !== undefined) await user.type(screen.getByLabelText('Apellido'), values.apellido)
  if (values.email !== undefined) await user.type(screen.getByLabelText(/^Correo/), values.email)
  if (values.password !== undefined) await user.type(screen.getByLabelText('Contraseña'), values.password)
  if (values.confirm !== undefined) await user.type(screen.getByLabelText('Confirmar contraseña'), values.confirm)
}

const valid: FormValues = {
  nombre: 'Carla',
  apellido: 'Cliente',
  email: 'cliente@example.com',
  password: strongPassword,
  confirm: strongPassword,
}

const submit = () => screen.getByRole('button', { name: 'Crear cuenta' })

beforeEach(() => {
  useSession.getState().clear()
})

describe('SignupForm', () => {
  it('shows separate Nombre and Apellido fields instead of a single full name', () => {
    mockApi(() => ({ status: 200, body: {} }))
    renderForm()
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
    expect(screen.getByLabelText('Apellido')).toBeInTheDocument()
    expect(screen.queryByLabelText('Nombre completo')).not.toBeInTheDocument()
  })

  it.each([
    ['Ana María', 'con espacio'],
    ['Ana2', 'con número'],
    ['Ana_', 'con símbolo'],
  ])('muestra error en línea para el nombre %j (%s) y no envía', async (nombre) => {
    const fetchMock = mockApi(() => ({ status: 201, body: {} }))
    const { user, onSuccess } = renderForm()

    await fill(user, { ...valid, nombre })
    await user.click(submit())

    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true')
    expect(await screen.findByText('Solo letras, sin espacios ni números.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('exige apellido y muestra el error en línea', async () => {
    const fetchMock = mockApi(() => ({ status: 201, body: {} }))
    const { user } = renderForm()

    await fill(user, { nombre: 'Carla', email: 'cliente@example.com', password: strongPassword, confirm: strongPassword })
    await user.click(submit())

    expect(await screen.findByText('Ingresa tu apellido.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('muestra error en línea para un correo inválido y no envía', async () => {
    const fetchMock = mockApi(() => ({ status: 201, body: {} }))
    const { user } = renderForm()

    await fill(user, { ...valid, email: 'a@b' })
    await user.click(submit())

    expect(await screen.findByText(/Ingresa un correo válido/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Correo/)).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('muestra error cuando el correo contiene espacios', async () => {
    mockApi(() => ({ status: 201, body: {} }))
    const { user } = renderForm()

    await fill(user, { ...valid, email: 'ana perez@example.com' })
    await user.click(submit())

    expect(await screen.findByText('El correo no puede contener espacios.')).toBeInTheDocument()
  })

  it('muestra error cuando la confirmación no coincide', async () => {
    const fetchMock = mockApi(() => ({ status: 201, body: {} }))
    const { user } = renderForm()

    await fill(user, { ...valid, confirm: 'Otra-clave1' })
    await user.click(submit())

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  describe('lista de requisitos de la contraseña', () => {
    it('no muestra ninguna lista de requisitos mientras se escribe', async () => {
      mockApi(() => ({ status: 200, body: {} }))
      const { user } = renderForm()

      expect(screen.queryByRole('list', { name: 'Requisitos de la contraseña' })).not.toBeInTheDocument()
      expect(screen.queryByText(/Pendiente:|Cumplido:/)).not.toBeInTheDocument()

      await user.type(screen.getByLabelText('Contraseña'), 'Abc')
      expect(screen.queryByRole('list', { name: 'Requisitos de la contraseña' })).not.toBeInTheDocument()
      expect(screen.queryByText(/Pendiente:|Cumplido:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/^Falta: /)).not.toBeInTheDocument()
    })

    it('mantiene el botón habilitado y al enviar con contraseña débil lista lo que falta sin llamar a la API', async () => {
      const fetchMock = mockApi(() => ({ status: 201, body: {} }))
      const { user, onSuccess } = renderForm()

      await fill(user, { ...valid, password: 'clave', confirm: 'clave' })
      expect(submit()).toBeEnabled()
      await user.click(submit())

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent(/^Falta: /)
      expect(alert).toHaveTextContent(/una letra mayúscula/)
      expect(alert).toHaveTextContent(/un número/)
      expect(alert).toHaveTextContent(/al menos 8 caracteres/)
      expect(alert).not.toHaveTextContent(/una letra minúscula/)
      expect(screen.getByLabelText('Contraseña')).toHaveFocus()
      expect(fetchMock).not.toHaveBeenCalled()
      expect(onSuccess).not.toHaveBeenCalled()

      await user.clear(screen.getByLabelText('Contraseña'))
      await user.clear(screen.getByLabelText('Confirmar contraseña'))
      await fill(user, { password: strongPassword, confirm: strongPassword })
      mockApi(() => ({ status: 201, body: { accessToken: 't', tokenType: 'Bearer', expiresIn: 3600, user: customer } }))
      await user.click(submit())
      await waitFor(() => { expect(onSuccess).toHaveBeenCalledTimes(1) })
      expect(screen.queryByText(/^Falta: /)).not.toBeInTheDocument()
    })

    it('al enviar con espacios en la contraseña avisa "sin espacios" y no llama a la API', async () => {
      const fetchMock = mockApi(() => ({ status: 201, body: {} }))
      const { user } = renderForm()

      await fill(user, { ...valid, password: 'Clave segura1!', confirm: 'Clave segura1!' })
      await user.click(submit())

      expect(await screen.findByRole('alert')).toHaveTextContent(/sin espacios/)
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  it('crea la cuenta enviando fullName = "Nombre Apellido", guarda la sesión y avisa al éxito', async () => {
    const fetchMock = mockApi(() => ({
      status: 201,
      body: { accessToken: 'tok-new', tokenType: 'Bearer', expiresIn: 3600, user: customer },
    }))
    const { user, onSuccess } = renderForm()

    await fill(user, { ...valid, email: ' cliente@example.com ' })
    await user.click(submit())

    await waitFor(() => { expect(onSuccess).toHaveBeenCalledTimes(1) })
    expect(useSession.getState().token).toBe('tok-new')
    expect(sentBody(fetchMock.mock.calls[0]?.[1])).toEqual({
      email: 'cliente@example.com',
      password: strongPassword,
      fullName: 'Carla Cliente',
    })
  })

  it('acepta letras con tilde y eñe en el payload', async () => {
    const fetchMock = mockApi(() => ({
      status: 201,
      body: { accessToken: 'tok-new', tokenType: 'Bearer', expiresIn: 3600, user: customer },
    }))
    const { user, onSuccess } = renderForm()

    await fill(user, { ...valid, nombre: 'María', apellido: 'Ñandú' })
    await user.click(submit())

    await waitFor(() => { expect(onSuccess).toHaveBeenCalledTimes(1) })
    expect(sentBody(fetchMock.mock.calls[0]?.[1])).toMatchObject({ fullName: 'María Ñandú' })
  })

  it('muestra el mensaje cuando el correo ya existe (409)', async () => {
    mockApi(() => apiError(409, 'CONFLICT', 'email already registered'))
    const { user, onSuccess } = renderForm()

    await fill(user, valid)
    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe un registro con esos datos.')
    expect(useSession.getState().token).toBeNull()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('no ofrece elegir rol', () => {
    mockApi(() => ({ status: 200, body: {} }))
    renderForm()
    expect(screen.queryByLabelText(/rol/i)).not.toBeInTheDocument()
  })
})

describe('barra de seguridad de la contraseña', () => {
  const bar = () => screen.getByRole('progressbar', { name: 'Seguridad de la contraseña' })

  it('crece con cada requisito y solo llega al máximo (verde) cuando se cumplen todos', async () => {
    mockApi(() => ({ status: 200, body: {} }))
    const { user } = renderForm()
    const password = screen.getByLabelText('Contraseña')

    expect(bar()).toHaveAttribute('aria-valuemin', '0')
    expect(bar()).toHaveAttribute('aria-valuemax', '5')
    expect(bar()).toHaveAttribute('aria-valuenow', '0')
    expect(bar()).toHaveAttribute('data-level', 'weak')
    expect(within(bar()).getByText('Débil')).toBeInTheDocument()

    await user.type(password, 'Abcdefg1')
    expect(bar()).toHaveAttribute('aria-valuenow', '4')
    expect(bar()).toHaveAttribute('data-level', 'medium')
    expect(within(bar()).getByText('Media')).toBeInTheDocument()

    await user.type(password, '!')
    expect(bar()).toHaveAttribute('aria-valuenow', '5')
    expect(bar()).toHaveAttribute('data-level', 'strong')
    expect(within(bar()).getByText('Segura')).toBeInTheDocument()
  })

  it('queda en media (no verde) si cumple el contenido pero lleva espacios', async () => {
    mockApi(() => ({ status: 200, body: {} }))
    const { user } = renderForm()

    await user.type(screen.getByLabelText('Contraseña'), 'Clave segura1!')
    expect(bar()).toHaveAttribute('aria-valuenow', '5')
    expect(bar()).toHaveAttribute('data-level', 'medium')
  })
})
