import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, customerUser, driverUser, mockApi, renderApp, sentBody } from '@/test/utils'

beforeEach(() => {
  useSession.getState().setToken('tok')
})

/** API en memoria con los mismos contratos que usa la pantalla de usuarios. */
function usersApi() {
  const users = [adminUser, driverUser, customerUser].map((u) => ({ ...u }))
  return mockApi((url, init) => {
    const method = init.method ?? 'GET'
    if (url.endsWith('/api/v1/auth/me')) return { status: 200, body: adminUser }
    if (url.endsWith('/api/v1/users') && method === 'GET') return { status: 200, body: { users } }
    const target = users.find((u) => url.endsWith(`/api/v1/users/${u.id}`))
    if (target && method === 'PATCH') {
      Object.assign(target, sentBody(init))
      return { status: 200, body: target }
    }
    return { status: 404, body: {} }
  })
}

/** El fondo es el primer hijo del panel del diálogo: un clic ahí equivale a pulsar fuera del modal. */
function backdropOf(dialog: HTMLElement): HTMLElement {
  const backdrop = dialog.querySelector<HTMLElement>(':scope > [aria-hidden="true"]')
  if (backdrop === null) throw new Error('el diálogo no tiene fondo')
  return backdrop
}

function callsTo(fetchMock: ReturnType<typeof usersApi>, method: string, suffix: string) {
  return fetchMock.mock.calls.filter(([u, i]) => u.endsWith(suffix) && (i?.method ?? 'GET') === method)
}

async function openEdit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Editar usuario Diego Driver' }))
  return screen.getByRole('dialog', { name: 'Editar Usuario' })
}

describe('modales de usuarios: cierre', () => {
  it('hacer clic en el fondo cierra un modal sin datos', async () => {
    usersApi()
    renderApp('/users')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
    const dialog = screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })

    await user.click(backdropOf(dialog))

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('con datos, el fondo pide confirmación antes de descartar', async () => {
    usersApi()
    renderApp('/users')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
    await user.type(screen.getByLabelText('Nombre'), 'Elena')
    const dialog = screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })

    await user.click(backdropOf(dialog))

    expect(screen.getByRole('alertdialog', { name: '¿Descartar cambios?' })).toBeInTheDocument()
  })

  it('Tab con el foco en el primer control vuelve al último (Shift+Tab desde el inicio)', async () => {
    usersApi()
    renderApp('/users')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
    const dialog = screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })

    within(dialog).getByRole('button', { name: 'Cerrar modal' }).focus()
    await user.keyboard('{Shift>}{Tab}{/Shift}')

    expect(within(dialog).getByRole('button', { name: 'Crear usuario' })).toHaveFocus()
  })

  it('Shift+Tab con el foco fuera del diálogo lo lleva al último control', async () => {
    usersApi()
    renderApp('/users')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
    const dialog = screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })

    // Se quita el foco del campo inicial: ya no hay un control del diálogo enfocado.
    const focused = document.activeElement
    if (focused instanceof HTMLElement) focused.blur()
    await user.keyboard('{Shift>}{Tab}{/Shift}')

    expect(within(dialog).getByRole('button', { name: 'Crear usuario' })).toHaveFocus()
  })

  it('Tab con el foco en el último control vuelve al primero', async () => {
    usersApi()
    renderApp('/users')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
    const dialog = screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })

    within(dialog).getByRole('button', { name: 'Crear usuario' }).focus()
    await user.tab()

    expect(within(dialog).getByRole('button', { name: 'Cerrar modal' })).toHaveFocus()
  })
})

describe('modal de edición: cambios sin guardar', () => {
  it('cancelar sin cambios cierra directo, sin confirmación', async () => {
    usersApi()
    renderApp('/users')
    const user = userEvent.setup()
    const dialog = await openEdit(user)

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('guardar sin cambios cierra el modal y no envía PATCH', async () => {
    const fetchMock = usersApi()
    renderApp('/users')
    const user = userEvent.setup()
    const dialog = await openEdit(user)

    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(callsTo(fetchMock, 'PATCH', `/api/v1/users/${driverUser.id}`)).toHaveLength(0)
  })

  it('editar el nombre y descartar desde la confirmación cierra sin guardar', async () => {
    const fetchMock = usersApi()
    renderApp('/users')
    const user = userEvent.setup()
    const dialog = await openEdit(user)

    await user.type(within(dialog).getByLabelText('Nombre'), 'X')
    expect(within(dialog).getByLabelText('Nombre')).toHaveValue('DiegoX')
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar modal' }))
    await user.click(screen.getByRole('button', { name: 'Descartar' }))

    await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull() })
    expect(callsTo(fetchMock, 'PATCH', `/api/v1/users/${driverUser.id}`)).toHaveLength(0)
  })

  it('"Seguir editando" en la confirmación mantiene el modal abierto con los cambios', async () => {
    usersApi()
    renderApp('/users')
    const user = userEvent.setup()
    const dialog = await openEdit(user)

    await user.type(within(dialog).getByLabelText('Nombre'), 'X')
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar modal' }))
    await user.click(screen.getByRole('button', { name: 'Seguir editando' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(within(dialog).getByLabelText('Nombre')).toHaveValue('DiegoX')
  })

  it('un nombre y apellido que juntos superan 120 caracteres se marcan en el apellido', async () => {
    usersApi()
    renderApp('/users')
    const user = userEvent.setup()
    const dialog = await openEdit(user)

    fireEvent.change(within(dialog).getByLabelText('Nombre'), { target: { value: 'A'.repeat(70) } })
    fireEvent.change(within(dialog).getByLabelText('Apellido'), { target: { value: 'B'.repeat(60) } })
    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }))

    expect(within(dialog).getByLabelText('Apellido')).toHaveAttribute('aria-invalid', 'true')
    expect(within(dialog).getByLabelText('Apellido')).toHaveAccessibleDescription('El nombre completo admite hasta 120 caracteres.')
  })
})

describe('listado de usuarios: refresco manual', () => {
  it('el botón Refrescar lista vuelve a pedir la lista', async () => {
    const fetchMock = usersApi()
    renderApp('/users')
    const user = userEvent.setup()
    await screen.findByText('Diego Driver')
    const before = callsTo(fetchMock, 'GET', '/api/v1/users').length

    await user.click(screen.getByRole('button', { name: 'Refrescar lista' }))

    await waitFor(() => { expect(callsTo(fetchMock, 'GET', '/api/v1/users').length).toBeGreaterThan(before) })
  })
})
