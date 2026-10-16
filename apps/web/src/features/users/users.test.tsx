import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, apiError, driverUser, mockApi, renderApp, sentBody } from '@/test/utils'

beforeEach(() => {
  useSession.getState().setToken('tok')
})

async function fillForm(email: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Nombre completo'), 'Diego Driver')
  await user.type(screen.getByLabelText('Correo'), email)
  await user.type(screen.getByLabelText('Contraseña inicial'), 'password123')
  await user.selectOptions(screen.getByLabelText('Rol'), 'DRIVER')
  await user.click(screen.getByRole('button', { name: 'Crear usuario' }))
}

it('crea un repartidor', async () => {
  const fetchMock = mockApi((url, init) => {
    if (url.endsWith('/api/v1/users') && init.method === 'POST') {
      return { status: 201, body: { ...adminUser, id: 'u-2', email: 'diego@example.com', fullName: 'Diego Driver', role: 'DRIVER' } }
    }
    return { status: 200, body: adminUser }
  })
  renderApp('/users/new')
  await fillForm('diego@example.com')

  expect(await screen.findByRole('status')).toHaveTextContent('Usuario diego@example.com creado como Repartidor.')
  const call = fetchMock.mock.calls.find(([u, i]) => u.endsWith('/api/v1/users') && i?.method === 'POST')
  expect(sentBody(call?.[1])).toEqual({ email: 'diego@example.com', password: 'password123', fullName: 'Diego Driver', role: 'DRIVER' })
})

it('muestra el conflicto de correo duplicado', async () => {
  mockApi((url, init) => (url.endsWith('/api/v1/users') && init.method === 'POST' ? apiError(409, 'CONFLICT') : { status: 200, body: adminUser }))
  renderApp('/users/new')
  await fillForm('dup@example.com')
  expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe un registro con esos datos.')
})

const customerUser = {
  ...adminUser,
  id: '33333333-3333-3333-3333-333333333333',
  email: 'cliente@example.com',
  fullName: 'Carla Cliente',
  role: 'CUSTOMER',
}

function listApi() {
  mockApi((url, init) => {
    if (url.endsWith('/api/v1/users') && init.method === 'GET') {
      return { status: 200, body: { users: [adminUser, customerUser] } }
    }
    return { status: 200, body: adminUser }
  })
}

it('lista los usuarios devueltos por la API y filtra por Clientes', async () => {
  listApi()
  renderApp('/users')
  const user = userEvent.setup()

  expect(await screen.findByText('Carla Cliente')).toBeInTheDocument()
  expect(screen.getAllByText('Ana Admin').length).toBeGreaterThan(0)

  await user.click(screen.getByRole('button', { name: 'Clientes' }))
  expect(screen.getByText('Carla Cliente')).toBeInTheDocument()
  expect(within(screen.getByRole('table')).queryByText('Ana Admin')).toBeNull()
})

it('muestra un error cuando falla la carga de usuarios', async () => {
  mockApi((url, init) =>
    url.endsWith('/api/v1/users') && init.method === 'GET' ? apiError(500, 'INTERNAL') : { status: 200, body: adminUser },
  )
  renderApp('/users')
  expect(await screen.findByRole('alert')).toBeInTheDocument()
})

// ─── Modales de usuarios ────────────────────────────────────────────────────

const diego = { ...driverUser, email: 'diego@example.com' }

/** API en memoria: la lista refleja los PATCH, POST y DELETE recibidos. */
function usersApi() {
  const users = [adminUser, diego, customerUser].map((u) => ({ ...u }))
  return mockApi((url, init) => {
    const method = init.method ?? 'GET'
    if (url.endsWith('/api/v1/auth/me')) return { status: 200, body: adminUser }
    if (url.endsWith('/api/v1/users') && method === 'GET') return { status: 200, body: { users } }
    if (url.endsWith('/api/v1/users') && method === 'POST') {
      const body = sentBody(init) as { email: string; fullName: string; role: string }
      const created = { ...adminUser, id: 'u-9', ...body }
      users.push(created)
      return { status: 201, body: created }
    }
    const target = users.find((u) => url.endsWith(`/api/v1/users/${u.id}`))
    if (target && method === 'PATCH') {
      Object.assign(target, sentBody(init))
      return { status: 200, body: target }
    }
    if (target && method === 'DELETE') {
      target.active = false
      return { status: 200, body: target }
    }
    return { status: 404, body: {} }
  })
}

it('crea un usuario desde el modal y refresca la lista', async () => {
  const fetchMock = usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
  const dialog = screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })

  await user.type(within(dialog).getByLabelText('Nombre completo'), 'Elena Nueva')
  await user.type(within(dialog).getByLabelText('Correo'), 'elena@example.com')
  await user.type(within(dialog).getByLabelText('Contraseña provisional'), 'Password123!')
  await user.click(within(dialog).getByRole('radio', { name: 'Repartidor' }))
  await user.click(within(dialog).getByRole('button', { name: 'Crear usuario' }))

  expect(await screen.findByText('Elena Nueva')).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).toBeNull()
  const call = fetchMock.mock.calls.find(([u, i]) => u.endsWith('/api/v1/users') && i?.method === 'POST')
  expect(sentBody(call?.[1])).toEqual({ email: 'elena@example.com', password: 'Password123!', fullName: 'Elena Nueva', role: 'DRIVER' })
})

it('el lápiz abre el modal de edición y guarda con PATCH', async () => {
  const fetchMock = usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Editar a Diego Driver' }))
  const dialog = screen.getByRole('dialog', { name: 'Editar Usuario' })

  expect(within(dialog).getByLabelText('Correo')).toHaveValue('diego@example.com')
  expect(within(dialog).getByLabelText('Correo')).toHaveAttribute('readonly')
  const name = within(dialog).getByLabelText('Nombre completo')
  await user.clear(name)
  await user.type(name, 'Diego Nuevo')
  await user.click(within(dialog).getByRole('radio', { name: 'Operador' }))
  await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }))

  expect(await screen.findByText('Diego Nuevo')).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).toBeNull()
  const call = fetchMock.mock.calls.find(([u, i]) => u.endsWith(`/api/v1/users/${driverUser.id}`) && i?.method === 'PATCH')
  expect(sentBody(call?.[1])).toEqual({ fullName: 'Diego Nuevo', role: 'OPERATOR' })
})

it('desactiva tras confirmar, con DELETE y estado Inactivo', async () => {
  const fetchMock = usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Desactivar a Diego Driver' }))
  const confirm = screen.getByRole('alertdialog', { name: 'Desactivar a Diego Driver' })

  expect(within(confirm).getByText(/dejará de poder iniciar sesión/)).toBeInTheDocument()
  expect(within(confirm).getByText(/historial/)).toBeInTheDocument()
  await user.click(within(confirm).getByRole('button', { name: 'Desactivar usuario' }))

  await waitFor(() => { expect(screen.queryByRole('alertdialog')).toBeNull() })
  const row = screen.getByText('Diego Driver').closest('tr')
  expect(row).not.toBeNull()
  expect(within(row as HTMLElement).getByText('Inactivo')).toBeInTheDocument()
  expect(fetchMock.mock.calls.some(([u, i]) => u.endsWith(`/api/v1/users/${driverUser.id}`) && i?.method === 'DELETE')).toBe(true)
})

it('ya no muestra el botón de escudo', async () => {
  usersApi()
  renderApp('/users')
  await screen.findByText('Diego Driver')
  expect(screen.queryByText('shield')).toBeNull()
  expect(screen.queryByTitle('Permisos')).toBeNull()
})

it('Escape cierra el modal y devuelve el foco al botón que lo abrió', async () => {
  usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  const opener = await screen.findByRole('button', { name: 'Nuevo Usuario' })
  await user.click(opener)
  expect(screen.getByLabelText('Nombre completo')).toHaveFocus()

  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(opener).toHaveFocus()
})

it('no ofrece Desactivar para la sesión propia', async () => {
  usersApi()
  renderApp('/users')
  expect(await screen.findByRole('button', { name: 'Desactivar a Carla Cliente' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Desactivar a Ana Admin' })).toBeNull()
})
