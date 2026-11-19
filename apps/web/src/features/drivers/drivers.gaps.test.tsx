import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, apiError, mockApi, renderApp } from '@/test/utils'
import { listDemoDrivers } from './demo'

beforeEach(() => {
  useSession.getState().setToken('tok')
})

const driver = {
  id: 'd-1',
  fullName: 'Luis Andrade',
  phone: '0991112233',
  city: 'Quito',
  vehicleType: 'MOTORIZADO',
  plate: 'PBA1234',
  active: true,
  status: 'AVAILABLE',
}

describe('repartidores: reintento', () => {
  it('si la lista no carga, Reintentar vuelve a pedirla y muestra los repartidores', async () => {
    let calls = 0
    mockApi((url) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
      if (url.endsWith('/api/v1/drivers')) {
        calls += 1
        return calls === 1 ? apiError(500, 'INTERNAL') : { status: 200, body: [driver] }
      }
      return { status: 200, body: [] }
    })
    renderApp('/drivers')
    const user = userEvent.setup()

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los repartidores.')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Luis Andrade')).toBeInTheDocument()
    expect(calls).toBe(2)
  })
})

describe('repartidores: datos de muestra', () => {
  it('la muestra tiene cuatro repartidores, uno inactivo y estados variados', async () => {
    const drivers = await listDemoDrivers()

    expect(drivers.map((d) => d.id)).toEqual(['d-1', 'd-2', 'd-3', 'd-4'])
    expect(drivers.filter((d) => !d.active).map((d) => d.id)).toEqual(['d-4'])
    expect(new Set(drivers.map((d) => d.status))).toEqual(new Set(['AVAILABLE', 'ON_ROUTE', 'ASSIGNED', 'OFFLINE']))
  })
})
