import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, apiError, driverUser, mockApi, renderApp, sentBody } from '@/test/utils'

beforeEach(() => {
  useSession.getState().setToken('tok')
})

async function fillForm(email: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Nombre'), 'Diego')
  await user.type(screen.getByLabelText('Apellido'), 'Driver')
  await user.type(screen.getByLabelText('Correo'), email)
  await user.type(screen.getByLabelText('Contraseña inicial'), 'Password123!')
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
  expect(sentBody(call?.[1])).toEqual({ email: 'diego@example.com', password: 'Password123!', fullName: 'Diego Driver', role: 'DRIVER' })
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

it('muestra un error de carga en una región aria-live', async () => {
  mockApi((url, init) =>
    url.endsWith('/api/v1/users') && init.method === 'GET' ? apiError(500, 'INTERNAL') : { status: 200, body: adminUser },
  )
  renderApp('/users')
  expect(await screen.findByText('No se pudo cargar la lista de usuarios. Intenta de nuevo.')).toHaveAttribute('aria-live', 'polite')
})

it('muestra "Cargando…" en la tabla mientras llega la lista', async () => {
  vi.stubGlobal('fetch', vi.fn((input: string) =>
    input.endsWith('/api/v1/users')
      ? new Promise<Response>(() => {})
      : Promise.resolve(new Response(JSON.stringify(adminUser), { status: 200, headers: { 'Content-Type': 'application/json' } })),
  ))
  renderApp('/users')
  expect(await within(await screen.findByRole('table')).findByText('Cargando…')).toBeInTheDocument()
})

it('muestra el estado vacío cuando no hay usuarios', async () => {
  mockApi((url, init) => (url.endsWith('/api/v1/users') && init.method === 'GET' ? { status: 200, body: { users: [] } } : { status: 200, body: adminUser }))
  renderApp('/users')
  expect(await screen.findByText('No hay usuarios registrados.')).toBeInTheDocument()
})

it('muestra el estado de filtros sin resultados', async () => {
  listApi()
  renderApp('/users?q=zzz-sin-coincidencia')
  expect(await screen.findByText('No se encontraron usuarios con los filtros aplicados.')).toBeInTheDocument()
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

it('crea un usuario desde el modal, confirma en vivo y refresca la lista', async () => {
  const fetchMock = usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
  const dialog = screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })

  await user.type(within(dialog).getByLabelText('Nombre'), 'Elena')
  await user.type(within(dialog).getByLabelText('Apellido'), 'Nueva')
  await user.type(within(dialog).getByLabelText('Correo'), 'elena@example.com')
  await user.type(within(dialog).getByLabelText('Contraseña provisional'), 'Password123!')
  await user.click(within(dialog).getByRole('radio', { name: 'Repartidor' }))
  await user.click(within(dialog).getByRole('button', { name: 'Crear usuario' }))

  expect(await screen.findByText('Usuario Elena Nueva creado.')).toHaveAttribute('aria-live', 'polite')
  expect(await screen.findByText('Elena Nueva')).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).toBeNull()
  const call = fetchMock.mock.calls.find(([u, i]) => u.endsWith('/api/v1/users') && i?.method === 'POST')
  expect(sentBody(call?.[1])).toEqual({ email: 'elena@example.com', password: 'Password123!', fullName: 'Elena Nueva', role: 'DRIVER' })
})

it('el modal de creación: contraseña con mostrar/ocultar, autocompletado y validación en vivo', async () => {
  usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
  const dialog = screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })

  expect(within(dialog).getByLabelText('Nombre')).toHaveAttribute('autocomplete', 'given-name')
  expect(within(dialog).getByLabelText('Apellido')).toHaveAttribute('autocomplete', 'family-name')
  expect(within(dialog).getByLabelText('Correo')).toHaveAttribute('autocomplete', 'off')
  expect(within(dialog).getByLabelText('Correo')).toHaveAttribute('spellcheck', 'false')

  const password = within(dialog).getByLabelText('Contraseña provisional')
  expect(password).toHaveAttribute('autocomplete', 'new-password')
  expect(password).toHaveAttribute('type', 'password')
  const toggle = within(dialog).getByRole('button', { name: 'Mostrar contraseña' })
  expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await user.click(toggle)
  expect(password).toHaveAttribute('type', 'text')
  expect(within(dialog).getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute('aria-pressed', 'true')

  expect(within(dialog).queryByRole('list', { name: 'Requisitos de la contraseña' })).toBeNull()
  expect(within(dialog).queryByText('Una letra mayúscula')).toBeNull()
  await user.type(password, 'Abcdefg1!')
  expect(within(dialog).getByTestId('password-rules-live')).toHaveTextContent('mayúscula')
})

it('la barra de contraseña empieza vacía y se completa al cumplir todas las reglas', async () => {
  usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
  const dialog = screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })
  const fill = within(dialog).getByTestId('password-strength-fill')

  expect(fill).toHaveStyle({ width: '0%' })
  await user.type(within(dialog).getByLabelText('Contraseña provisional'), 'Abcdefg1')
  expect(fill).toHaveStyle({ width: '83.33333333333334%' })
  await user.type(within(dialog).getByLabelText('Contraseña provisional'), '!')
  expect(fill).toHaveStyle({ width: '100%' })
})

it('anuncia en vivo, solo para lectores de pantalla, las reglas cumplidas', async () => {
  usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
  const dialog = screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })
  const live = within(dialog).getByTestId('password-rules-live')

  expect(live).toHaveAttribute('aria-live', 'polite')
  expect(live).toHaveClass('sr-only')
  await user.type(within(dialog).getByLabelText('Contraseña provisional'), 'A')
  expect(live).toHaveTextContent('mayúscula')
  await user.type(within(dialog).getByLabelText('Contraseña provisional'), 'bcdefgh1')
  expect(live).toHaveTextContent('mínimo 8 caracteres')
  expect(live).toHaveTextContent('número')
})

it('al enviar con errores enfoca el primer campo inválido', async () => {
  usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
  const dialog = screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })

  await user.type(within(dialog).getByLabelText('Nombre'), 'Elena')
  await user.type(within(dialog).getByLabelText('Apellido'), 'Pérez')
  await user.click(within(dialog).getByRole('button', { name: 'Crear usuario' }))
  expect(within(dialog).getByLabelText('Correo')).toHaveFocus()
  expect(within(dialog).getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true')
})

it('Tab no sale del diálogo de creación', async () => {
  usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
  const dialog = screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })

  for (let i = 0; i < 15; i++) {
    await user.tab()
    expect(dialog.contains(document.activeElement)).toBe(true)
  }
})

it('el lápiz abre el modal de edición y guarda con PATCH solo de los campos cambiados', async () => {
  const fetchMock = usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Editar usuario Diego Driver' }))
  const dialog = screen.getByRole('dialog', { name: 'Editar Usuario' })

  expect(within(dialog).getByLabelText('Correo')).toHaveValue('diego@example.com')
  expect(within(dialog).getByLabelText('Correo')).toHaveAttribute('readonly')
  await user.clear(within(dialog).getByLabelText('Apellido'))
  await user.type(within(dialog).getByLabelText('Apellido'), 'Nuevo')
  await user.click(within(dialog).getByRole('radio', { name: 'Operador' }))
  await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }))

  expect(await screen.findByText('Diego Nuevo')).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).toBeNull()
  const call = fetchMock.mock.calls.find(([u, i]) => u.endsWith(`/api/v1/users/${driverUser.id}`) && i?.method === 'PATCH')
  expect(sentBody(call?.[1])).toEqual({ fullName: 'Diego Nuevo', role: 'OPERATOR' })
})

it('al editar solo el nombre, el PATCH no envía el rol', async () => {
  const fetchMock = usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Editar usuario Diego Driver' }))
  const dialog = screen.getByRole('dialog', { name: 'Editar Usuario' })
  await user.clear(within(dialog).getByLabelText('Apellido'))
  await user.type(within(dialog).getByLabelText('Apellido'), 'Solo Nombre')
  await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }))

  expect(await screen.findByText('Usuario Diego Solo Nombre actualizado.')).toHaveAttribute('aria-live', 'polite')
  const call = fetchMock.mock.calls.find(([u, i]) => u.endsWith(`/api/v1/users/${driverUser.id}`) && i?.method === 'PATCH')
  expect(sentBody(call?.[1])).toEqual({ fullName: 'Diego Solo Nombre' })
})

it('desactiva tras confirmar, con DELETE y estado Inactivo', async () => {
  const fetchMock = usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Desactivar usuario Diego Driver' }))
  const confirm = screen.getByRole('alertdialog', { name: 'Desactivar a Diego Driver' })

  expect(within(confirm).getByText(/dejará de poder iniciar sesión/)).toBeInTheDocument()
  expect(within(confirm).getByText(/historial/)).toBeInTheDocument()
  await user.click(within(confirm).getByRole('button', { name: 'Desactivar usuario' }))

  await waitFor(() => { expect(screen.queryByRole('alertdialog')).toBeNull() })
  const row = screen.getByText('Diego Driver').closest('tr')
  expect(row).not.toBeNull()
  expect(within(row as HTMLElement).getByText('Inactivo')).toBeInTheDocument()
  expect(within(row as HTMLElement).queryByRole('button', { name: /Desactivar usuario/ })).toBeNull()
  expect(fetchMock.mock.calls.some(([u, i]) => u.endsWith(`/api/v1/users/${driverUser.id}`) && i?.method === 'DELETE')).toBe(true)
})

it('el diálogo de desactivar es alertdialog y enfoca Cancelar al abrirse', async () => {
  usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Desactivar usuario Diego Driver' }))
  const confirm = screen.getByRole('alertdialog', { name: 'Desactivar a Diego Driver' })
  expect(within(confirm).getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('alertdialog')).toBeNull()
})

it('no muestra datos falsos ni controles sin función', async () => {
  usersApi()
  renderApp('/users')
  await screen.findByText('Diego Driver')
  const text = document.body.textContent
  for (const fake of ['Sincronizado', 'Exportar', 'Protocolo de seguridad', 'Doble Factor', '2FA', 'Políticas Activas', 'Todos los Centros', 'Centro / Hub', 'Última', 'Root', '9 turno', '94%', '+3', 'en ruta', 'Más opciones', 'Permisos']) {
    expect(text).not.toContain(fake)
  }
  expect(screen.queryByAltText('Pikka Mascot')).toBeNull()
  expect(screen.queryByText('shield_person')).toBeNull()
  expect(screen.queryByText('shield')).toBeNull()
  expect(screen.queryByRole('combobox', { name: 'Centro' })).toBeNull()
})

it('los filtros de rol, estado y búsqueda se reflejan en la URL', async () => {
  usersApi()
  const { router } = renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Clientes' }))
  expect(router.state.location.search).toContain('rol=CUSTOMER')
  expect(screen.getByRole('button', { name: 'Clientes' })).toHaveAttribute('aria-pressed', 'true')

  await user.type(screen.getByPlaceholderText(/Buscar por nombre o correo/), 'carla')
  expect(router.state.location.search).toContain('q=carla')

  await user.selectOptions(screen.getByLabelText('Estado'), 'inactivo')
  expect(router.state.location.search).toContain('estado=inactivo')
})

it('lee rol, estado y búsqueda de la URL al cargar', async () => {
  usersApi()
  renderApp('/users?rol=CUSTOMER&estado=activo&q=carla')

  expect(await screen.findByText('Carla Cliente')).toBeInTheDocument()
  expect(screen.queryByText('Diego Driver')).toBeNull()
  expect(screen.getByLabelText('Estado')).toHaveValue('activo')
  expect(screen.getByPlaceholderText(/Buscar por nombre o correo/)).toHaveValue('carla')
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
  expect(screen.getByLabelText('Nombre')).toHaveFocus()

  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(opener).toHaveFocus()
})

it('no ofrece Desactivar para la sesión propia', async () => {
  usersApi()
  renderApp('/users')
  expect(await screen.findByRole('button', { name: 'Desactivar usuario Carla Cliente' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Desactivar usuario Ana Admin' })).toBeNull()
})

// ─── Paginación ─────────────────────────────────────────────────────────────

function manyUsers(count: number, roleFor: (i: number) => string = () => 'OPERATOR') {
  const users = Array.from({ length: count }, (_, i) => ({
    ...adminUser,
    id: `p-${String(i + 1)}`,
    email: `u${String(i + 1)}@example.com`,
    fullName: `Usuario ${String(i + 1).padStart(2, '0')}`,
    role: roleFor(i),
  }))
  mockApi((url, init) => (url.endsWith('/api/v1/users') && (init.method ?? 'GET') === 'GET'
    ? { status: 200, body: { users } }
    : { status: 200, body: adminUser }))
}

function visibleRowNames() {
  const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
  return rows.map((row) => row.querySelector('td')?.textContent ?? '')
}

it('pagina 25 usuarios en 5 páginas de 5 y navegar cambia las filas visibles', async () => {
  manyUsers(25)
  const { router } = renderApp('/users')
  const user = userEvent.setup()
  await screen.findByText('Usuario 01')

  expect(screen.getByText('Mostrando 1–5 de 25')).toHaveClass('tabular-nums')
  expect(visibleRowNames()).toHaveLength(5)
  expect(visibleRowNames()[0]).toContain('Usuario 01')

  await user.click(screen.getByRole('button', { name: 'Siguiente página' }))
  expect(screen.getByText('Mostrando 6–10 de 25')).toBeInTheDocument()
  expect(visibleRowNames()[0]).toContain('Usuario 06')
  expect(router.state.location.search).toContain('pagina=2')

  await user.click(screen.getByRole('button', { name: 'Página 5' }))
  expect(screen.getByText('Mostrando 21–25 de 25')).toBeInTheDocument()
  expect(visibleRowNames()).toHaveLength(5)
  expect(router.state.location.search).toContain('pagina=5')

  await user.click(screen.getByRole('button', { name: 'Página anterior' }))
  expect(screen.getByText('Mostrando 16–20 de 25')).toBeInTheDocument()
})

it('la página de la URL se lee al cargar y se clampa a la última si está fuera de rango', async () => {
  manyUsers(25)
  renderApp('/users?pagina=9')
  expect(await screen.findByText('Mostrando 21–25 de 25')).toBeInTheDocument()
})

it('cambiar el filtro vuelve a la página 1', async () => {
  manyUsers(25, (i) => (i < 12 ? 'CUSTOMER' : 'OPERATOR'))
  const { router } = renderApp('/users?pagina=2')
  const user = userEvent.setup()
  await screen.findByText('Usuario 06')

  await user.click(screen.getByRole('button', { name: 'Clientes' }))
  expect(screen.getByText('Mostrando 1–5 de 12')).toBeInTheDocument()
  expect(router.state.location.search).not.toContain('pagina=')
})

it('muestra la paginación aunque haya una sola página, con los botones deshabilitados', async () => {
  manyUsers(5)
  renderApp('/users')
  await screen.findByText('Usuario 01')
  expect(screen.getByText(/Mostrando 1–5 de 5/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Siguiente página' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
})

// ─── Descartar cambios sin guardar ──────────────────────────────────────────

it('con datos escritos, Escape pide confirmar y no cierra el modal', async () => {
  usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
  await user.type(screen.getByLabelText('Nombre'), 'Elena')
  await user.keyboard('{Escape}')

  const confirm = screen.getByRole('alertdialog', { name: '¿Descartar cambios?' })
  expect(within(confirm).getByRole('button', { name: 'Seguir editando' })).toHaveFocus()
  expect(screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })).toBeInTheDocument()
})

it('"Seguir editando" cierra la confirmación y mantiene los datos', async () => {
  usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
  await user.type(screen.getByLabelText('Nombre'), 'Elena')
  await user.keyboard('{Escape}')
  await user.click(screen.getByRole('button', { name: 'Seguir editando' }))

  expect(screen.queryByRole('alertdialog')).toBeNull()
  expect(screen.getByLabelText('Nombre')).toHaveValue('Elena')
})

it('"Descartar" cierra el modal y al reabrirlo el formulario está limpio', async () => {
  usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
  await user.type(screen.getByLabelText('Nombre'), 'Elena')
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))
  await user.click(screen.getByRole('button', { name: 'Descartar' }))

  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.queryByRole('alertdialog')).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Nuevo Usuario' }))
  expect(screen.getByLabelText('Nombre')).toHaveValue('')
})

it('sin datos, Escape cierra directo sin confirmación', async () => {
  usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
  await user.keyboard('{Escape}')

  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.queryByRole('alertdialog')).toBeNull()
})

it('al editar, cambiar el nombre y pulsar la X pide confirmación', async () => {
  usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Editar usuario Diego Driver' }))
  const dialog = screen.getByRole('dialog', { name: 'Editar Usuario' })
  await user.type(within(dialog).getByLabelText('Apellido'), ' Nuevo')
  await user.click(within(dialog).getByRole('button', { name: 'Cerrar modal' }))

  expect(screen.getByRole('alertdialog', { name: '¿Descartar cambios?' })).toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: 'Editar Usuario' })).toBeInTheDocument()
})

// ─── Nombre y apellido ──────────────────────────────────────────────────────

it('nombre y apellido son obligatorios y el error va junto al campo', async () => {
  usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
  const dialog = screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })
  await user.click(within(dialog).getByRole('button', { name: 'Crear usuario' }))

  const nombre = within(dialog).getByLabelText('Nombre')
  const apellido = within(dialog).getByLabelText('Apellido')
  expect(nombre).toHaveAttribute('aria-invalid', 'true')
  expect(nombre).toHaveAccessibleDescription('Ingresa el nombre.')
  expect(apellido).toHaveAttribute('aria-invalid', 'true')
  expect(apellido).toHaveAccessibleDescription('Ingresa el apellido.')
})

it('envía nombre y apellido concatenados con un solo espacio', async () => {
  const fetchMock = usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
  const dialog = screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })
  await user.type(within(dialog).getByLabelText('Nombre'), '  Ana  ')
  await user.type(within(dialog).getByLabelText('Apellido'), ' Pérez ')
  await user.type(within(dialog).getByLabelText('Correo'), 'ana@example.com')
  await user.type(within(dialog).getByLabelText('Contraseña provisional'), 'Password123!')
  await user.click(within(dialog).getByRole('button', { name: 'Crear usuario' }))

  await screen.findByText('Usuario Ana Pérez creado.')
  const call = fetchMock.mock.calls.find(([u, i]) => u.endsWith('/api/v1/users') && i?.method === 'POST')
  expect(sentBody(call?.[1])).toMatchObject({ fullName: 'Ana Pérez' })
})

it('al editar, separa el nombre existente en nombre (primera palabra) y apellido (el resto)', async () => {
  usersApi()
  renderApp('/users')
  await userEvent.setup().click(await screen.findByRole('button', { name: 'Editar usuario Diego Driver' }))
  const dialog = screen.getByRole('dialog', { name: 'Editar Usuario' })
  expect(within(dialog).getByLabelText('Nombre')).toHaveValue('Diego')
  expect(within(dialog).getByLabelText('Apellido')).toHaveValue('Driver')
})

it('la contraseña se puede mostrar y ocultar, y el tipo del input cambia', async () => {
  usersApi()
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
  const dialog = screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })
  const password = within(dialog).getByLabelText('Contraseña provisional')
  await user.click(within(dialog).getByRole('button', { name: 'Mostrar contraseña' }))
  expect(password).toHaveAttribute('type', 'text')
  await user.click(within(dialog).getByRole('button', { name: 'Ocultar contraseña' }))
  expect(password).toHaveAttribute('type', 'password')
})
