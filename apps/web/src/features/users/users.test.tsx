import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, apiError, mockApi, renderApp, sentBody } from '@/test/utils'

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
