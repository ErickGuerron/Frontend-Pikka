import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, mockApi, renderApp } from '@/test/utils'
import { filterDrivers, parseDriver, type Driver } from './types'

const drivers: Driver[] = [
  { id: 'd-1', fullName: 'Luis Andrade', phone: '0991112233', active: true, status: 'AVAILABLE' },
  { id: 'd-2', fullName: 'María Paredes', phone: '0992223344', active: true, status: 'ON_ROUTE' },
  { id: 'd-3', fullName: 'Ana Salazar', phone: '0994445566', active: false, status: 'OFFLINE' },
]

function mockDrivers(response: { status: number; body: unknown }) {
  return mockApi((url) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
    if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
    if (url.endsWith('/api/v1/drivers')) return response
    return { status: 200, body: [] }
  })
}

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('repartidores', () => {
  it('lista los repartidores con su estado y si están activos', async () => {
    mockDrivers({ status: 200, body: drivers })
    renderApp('/drivers')

    const table = await screen.findByRole('table')
    expect(within(table).getByText('Luis Andrade')).toBeTruthy()
    expect(within(table).getByText('En ruta')).toBeTruthy()
    expect(within(table).getByText('Fuera de línea')).toBeTruthy()
  })

  it('filtra por estado y por nombre', async () => {
    mockDrivers({ status: 200, body: drivers })
    const user = userEvent.setup()
    renderApp('/drivers')
    await screen.findByRole('table')

    await user.selectOptions(screen.getByLabelText('Estado'), 'ON_ROUTE')
    expect(screen.queryByText('Luis Andrade')).toBeNull()
    expect(screen.getByText('María Paredes')).toBeTruthy()

    await user.selectOptions(screen.getByLabelText('Estado'), 'ALL')
    await user.type(screen.getByLabelText('Buscar'), 'salazar')
    expect(screen.getByText('Ana Salazar')).toBeTruthy()
    expect(screen.queryByText('Luis Andrade')).toBeNull()
  })

  it('muestra un error con reintento cuando el servicio falla', async () => {
    mockDrivers({ status: 500, body: { error: { code: 'INTERNAL', message: 'boom' } } })
    renderApp('/drivers')

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })

  it('muestra un mensaje cuando no hay repartidores', async () => {
    mockDrivers({ status: 200, body: [] })
    renderApp('/drivers')

    await waitFor(() => {
      expect(screen.getByText('No hay repartidores registrados.')).toBeTruthy()
    })
  })
})

describe('reglas de repartidores', () => {
  it('rechaza un estado que no existe', () => {
    expect(() => parseDriver({ id: 'x', fullName: 'X', phone: '1', active: true, status: 'LOST' })).toThrow(RangeError)
  })

  it('filtra por texto y estado sin distinguir mayúsculas', () => {
    expect(filterDrivers(drivers, 'LUIS', 'ALL').map((d) => d.id)).toEqual(['d-1'])
    expect(filterDrivers(drivers, '', 'OFFLINE').map((d) => d.id)).toEqual(['d-3'])
    expect(filterDrivers(drivers, '0992', 'ALL').map((d) => d.id)).toEqual(['d-2'])
  })
})
