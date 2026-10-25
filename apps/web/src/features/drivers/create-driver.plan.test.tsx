import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, mockApi, renderApp } from '@/test/utils'

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('PLAN: driver creation with an empty form', () => {
  it('createDriver_allFieldsEmpty_flagsEveryRequiredFieldAndMakesNoServerCall', async () => {
    const fetchMock = mockApi((url) => {
      if (url.endsWith('/api/v1/drivers')) return { status: 200, body: [] }
      return { status: 200, body: adminUser }
    })
    const user = userEvent.setup()
    renderApp('/drivers/new')

    await user.click(await screen.findByRole('button', { name: 'Crear repartidor' }))

    const required: [label: string, message: string][] = [
      ['Nombre', 'Ingresa el nombre.'],
      ['Apellido', 'Ingresa el apellido.'],
      ['Fecha de nacimiento', 'Ingresa la fecha de nacimiento.'],
      ['Teléfono de contacto', 'Ingresa el teléfono de contacto.'],
      ['Ciudad', 'Ingresa tu ciudad.'],
      ['Tipo de vehículo', 'Elige el tipo de vehículo.'],
      ['Documento de identidad', 'Ingresa el documento de identidad.'],
      ['Placa', 'Ingresa la placa.'],
      ['Correo', 'Ingresa tu correo electrónico.'],
      ['Contraseña inicial', 'Ingresa la contraseña inicial.'],
    ]
    for (const [label, message] of required) {
      expect(await screen.findByText(message)).toBeInTheDocument()
      expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true')
    }
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })
})
