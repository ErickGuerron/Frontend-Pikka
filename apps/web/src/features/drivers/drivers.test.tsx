import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, mockApi, renderApp } from '@/test/utils'
import { filterDrivers, parseDriver, type Driver } from './types'

const drivers: Driver[] = [
  { id: 'd-1', fullName: 'Luis Andrade', phone: '0991112233', city: 'Quito', vehicleType: 'MOTORIZADO', plate: 'PBA1234', active: true, status: 'AVAILABLE' },
  { id: 'd-2', fullName: 'María Paredes', phone: '0992223344', city: 'Cuenca', vehicleType: 'SUV', plate: 'CAB5678', active: true, status: 'ON_ROUTE' },
  { id: 'd-3', fullName: 'Ana Salazar', phone: '0994445566', city: 'Guayaquil', vehicleType: 'AUTOMOVIL', plate: 'GAA0001', active: false, status: 'OFFLINE' },
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

  it('muestra ciudad, vehículo y placa de cada repartidor', async () => {
    mockDrivers({ status: 200, body: drivers })
    renderApp('/drivers')

    const table = await screen.findByRole('table')
    expect(within(table).getByText('Cuenca')).toBeTruthy()
    expect(within(table).getByText('SUV')).toBeTruthy()
    expect(within(table).getByText('Motorizado')).toBeTruthy()
    expect(within(table).getByText('PBA1234')).toBeTruthy()
  })

  it('busca por placa y por ciudad', async () => {
    mockDrivers({ status: 200, body: drivers })
    const user = userEvent.setup()
    renderApp('/drivers')
    await screen.findByRole('table')

    await user.type(screen.getByLabelText('Buscar'), 'cab5678')
    expect(screen.getByText('María Paredes')).toBeTruthy()
    expect(screen.queryByText('Luis Andrade')).toBeNull()

    await user.clear(screen.getByLabelText('Buscar'))
    await user.type(screen.getByLabelText('Buscar'), 'guayaquil')
    expect(screen.getByText('Ana Salazar')).toBeTruthy()
    expect(screen.queryByText('María Paredes')).toBeNull()
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
    expect(() => parseDriver({ ...drivers[0], status: 'LOST' })).toThrow(RangeError)
  })

  it('rechaza un tipo de vehículo que no existe', () => {
    expect(() => parseDriver({ ...drivers[0], vehicleType: 'BICICLETA' })).toThrow(RangeError)
  })

  it('acepta la respuesta del gateway con campos de más', () => {
    const parsed = parseDriver({ ...drivers[0], userId: 'u-1', firstName: 'Luis', lastName: 'Andrade' })
    expect(parsed.plate).toBe('PBA1234')
  })

  it('filtra por texto y estado sin distinguir mayúsculas', () => {
    expect(filterDrivers(drivers, 'LUIS', 'ALL').map((d) => d.id)).toEqual(['d-1'])
    expect(filterDrivers(drivers, '', 'OFFLINE').map((d) => d.id)).toEqual(['d-3'])
    expect(filterDrivers(drivers, '0992', 'ALL').map((d) => d.id)).toEqual(['d-2'])
    expect(filterDrivers(drivers, 'gaa', 'ALL').map((d) => d.id)).toEqual(['d-3'])
    expect(filterDrivers(drivers, 'QUITO', 'ALL').map((d) => d.id)).toEqual(['d-1'])
  })
})
