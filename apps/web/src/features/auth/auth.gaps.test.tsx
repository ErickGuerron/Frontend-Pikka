import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { mockApi, renderApp } from '@/test/utils'
import { customerAccount, signupReply } from './auth.fixtures'

beforeEach(() => {
  useSession.getState().clear()
  mockApi(() => ({ status: 200, body: { status: 'ready' } }))
})

describe('inicio de sesión: mostrar y ocultar la contraseña', () => {
  it('el botón alterna el tipo del campo y su estado de presión', async () => {
    renderApp('/login')
    const user = userEvent.setup()
    const password = screen.getByLabelText('Contraseña')
    expect(password).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(password).toHaveAttribute('type', 'password')
  })
})

describe('registro de cliente: éxito en la página de acceso', () => {
  it('un registro correcto navega fuera de la página de acceso', async () => {
    mockApi((url, init) => {
      if (url.endsWith('/api/v1/auth/signup') && init.method === 'POST') return signupReply('tok-nuevo')
      if (url.endsWith('/auth/me')) return { status: 200, body: customerAccount }
      return { status: 200, body: { status: 'ready' } }
    })
    const { router } = renderApp('/login?modo=registro')
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Nombre'), 'Carla')
    await user.type(screen.getByLabelText('Apellido'), 'Cliente')
    await user.type(screen.getByLabelText('Ciudad'), 'Quito')
    await user.type(screen.getByLabelText('Teléfono'), '0991234567')
    await user.type(screen.getByLabelText(/^Correo/), 'cliente@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Clave-segura1')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Clave-segura1')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() => { expect(router.state.location.pathname).not.toBe('/login') })
    expect(useSession.getState().token).toBe('tok-nuevo')
  })
})

describe('registro de cliente: mostrar y ocultar la contraseña', () => {
  it('en el formulario de registro, el mismo control alterna la contraseña', async () => {
    renderApp('/login?modo=registro')
    const user = userEvent.setup()
    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' })

    await user.click(toggle)

    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument()
  })
})
