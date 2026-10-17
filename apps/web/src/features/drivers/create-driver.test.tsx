import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, apiError, mockApi, renderApp, sentBody } from '@/test/utils'

const operatorUser = { ...adminUser, id: '44444444-4444-4444-4444-444444444444', fullName: 'Olga Operadora', role: 'OPERATOR' }

const created = {
  user: { ...adminUser, id: 'u-9', email: 'lucas@example.com', fullName: 'Lucas Martinez', role: 'DRIVER' },
  driver: {
    id: 'd-9', userId: 'u-9', firstName: 'Lucas', lastName: 'Martinez', birthDate: '1999-03-15', phone: '0987654321',
    vehicleType: 'MOTORIZADO', identifier: '1712345678', plate: 'PBA1234', city: 'Quito', active: true,
    status: 'AVAILABLE', createdAt: '2026-10-16T10:00:00Z',
  },
}

beforeEach(() => {
  useSession.getState().setToken('tok')
})

function mockCreate(post: { status: number; body: unknown }, me: unknown = adminUser) {
  return mockApi((url, init) => {
    if (url.endsWith('/api/v1/drivers') && init.method === 'POST') return post
    if (url.endsWith('/api/v1/drivers')) return { status: 200, body: [] }
    return { status: 200, body: me }
  })
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText('Nombre'), 'Lucas')
  await user.type(screen.getByLabelText('Apellido'), 'Martinez')
  await user.type(screen.getByLabelText('Fecha de nacimiento'), '1999-03-15')
  await user.type(screen.getByLabelText('Teléfono de contacto'), '098 765-4321')
  await user.type(screen.getByLabelText('Ciudad'), 'Quito')
  await user.selectOptions(screen.getByLabelText('Tipo de vehículo'), 'MOTORIZADO')
  await user.type(screen.getByLabelText('Documento de identidad'), '17-12345678')
  await user.type(screen.getByLabelText('Placa'), 'pba-1234')
  await user.type(screen.getByLabelText('Correo'), 'lucas@example.com')
  await user.type(screen.getByLabelText('Contraseña inicial'), 'password123')
}

const submit = () => screen.getByRole('button', { name: 'Crear repartidor' })

describe('alta de repartidor', () => {
  it('envía el perfil normalizado y confirma el alta', async () => {
    const fetchMock = mockCreate({ status: 201, body: created })
    const user = userEvent.setup()
    renderApp('/drivers/new')
    await fillValid(user)

    await user.click(submit())

    expect(await screen.findByRole('status')).toHaveTextContent('Lucas Martinez')
    const call = fetchMock.mock.calls.find(([url, init]) => url.endsWith('/api/v1/drivers') && init?.method === 'POST')
    expect(sentBody(call?.[1])).toEqual({
      email: 'lucas@example.com',
      password: 'password123',
      firstName: 'Lucas',
      lastName: 'Martinez',
      birthDate: '1999-03-15',
      phone: '0987654321',
      vehicleType: 'MOTORIZADO',
      identifier: '1712345678',
      plate: 'PBA1234',
      city: 'Quito',
    })
  })

  it('con datos inválidos muestra los errores y no llama al servidor', async () => {
    const fetchMock = mockCreate({ status: 201, body: created })
    const user = userEvent.setup()
    renderApp('/drivers/new')
    await user.type(await screen.findByLabelText('Fecha de nacimiento'), '2020-01-01')

    await user.click(submit())

    expect(await screen.findByText(/al menos 18 años/)).toBeTruthy()
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('ante un 409 avisa del duplicado, conserva lo escrito y sugiere otro correo', async () => {
    mockCreate(apiError(409, 'CONFLICT', 'plate'))
    const user = userEvent.setup()
    renderApp('/drivers/new')
    await fillValid(user)

    await user.click(submit())

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/ya registrados/i)
    expect(alert).toHaveTextContent(/otro correo/i)
    expect(screen.getByLabelText('Nombre')).toHaveValue('Lucas')
  })

  it('ante un 503 muestra que el servicio no está disponible', async () => {
    mockCreate(apiError(503, 'UPSTREAM_UNAVAILABLE'))
    const user = userEvent.setup()
    renderApp('/drivers/new')
    await fillValid(user)

    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo conectar/i)
  })

  it('deshabilita el botón mientras envía para no duplicar el alta', async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => { release = resolve })
    mockApi((url, init) => {
      if (url.endsWith('/api/v1/drivers') && init.method === 'POST') return { status: 201, body: created }
      return { status: 200, body: adminUser }
    })
    const original = globalThis.fetch
    globalThis.fetch = ((input: string, init?: RequestInit) =>
      (input.endsWith('/api/v1/drivers') && init?.method === 'POST' ? gate : Promise.resolve()).then(() => original(input, init))) as typeof fetch
    const user = userEvent.setup()
    renderApp('/drivers/new')
    await fillValid(user)

    await user.click(submit())

    await waitFor(() => { expect(screen.getByRole('button', { name: 'Creando…' })).toBeDisabled() })
    release()
    expect(await screen.findByRole('status')).toBeTruthy()
  })

  it('un operador no entra al formulario', async () => {
    mockCreate({ status: 201, body: created }, operatorUser)
    const { router } = renderApp('/drivers/new')

    await waitFor(() => { expect(router.state.location.pathname).toBe('/') })
    expect(screen.queryByLabelText('Placa')).toBeNull()
  })

  it('el botón "Nuevo repartidor" solo lo ve el administrador', async () => {
    mockCreate({ status: 201, body: created })
    renderApp('/drivers')
    expect(await screen.findByRole('link', { name: 'Nuevo repartidor' })).toHaveAttribute('href', '/drivers/new')
  })

  it('el operador ve el listado pero no el botón', async () => {
    mockCreate({ status: 201, body: created }, operatorUser)
    renderApp('/drivers')
    await screen.findByRole('heading', { name: 'Repartidores' })
    expect(screen.queryByRole('link', { name: 'Nuevo repartidor' })).toBeNull()
  })
})
