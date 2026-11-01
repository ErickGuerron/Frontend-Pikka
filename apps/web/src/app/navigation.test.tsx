import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, driverUser, mockApi, renderApp } from '@/test/utils'

const operatorUser = { ...adminUser, id: '33333333-3333-3333-3333-333333333333', fullName: 'Olivia Operadora', role: 'OPERATOR' }

/** Responde al perfil del usuario y registra cualquier petición de datos. */
function mockAs(user: typeof adminUser) {
  return mockApi((url) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: user }
    if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
    return { status: 200, body: [] }
  })
}

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('menú según el rol', () => {
  it('el administrador ve todas las secciones', async () => {
    mockAs(adminUser)
    renderApp('/')
    for (const label of ['Inicio', 'Pedidos', 'Excepciones', 'Zonas', 'Rutas', 'Repartidores', 'Seguimiento', 'Usuarios']) {
      expect(await screen.findByRole('link', { name: label })).toBeInTheDocument()
    }
  })

  it('el operador no ve Usuarios', async () => {
    mockAs(operatorUser)
    renderApp('/')
    expect(await screen.findByRole('link', { name: 'Repartidores' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument()
  })

  it('el repartidor no ve ninguna sección en la web', async () => {
    mockAs(driverUser)
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Usa la app móvil de Pikka' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Repartidores' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Pedidos' })).not.toBeInTheDocument()
  })
})

describe('acceso por URL', () => {
  it('el operador que abre Usuarios por URL vuelve a Inicio con aviso', async () => {
    mockAs(operatorUser)
    const { router } = renderApp('/users')
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes acceso a Usuarios.')
    expect(router.state.location.pathname).toBe('/')
  })

  it('el repartidor que abre Repartidores por URL no recibe la lista', async () => {
    const fetchMock = mockAs(driverUser)
    renderApp('/drivers')
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes acceso a Repartidores.')
    const urls = fetchMock.mock.calls.map(([url]) => url)
    expect(urls.some((url) => url.includes('/drivers'))).toBe(false)
  })
})

describe('no pedir datos que el rol no verá', () => {
  it('el repartidor no consulta el estado del sistema en Inicio', async () => {
    const fetchMock = mockAs(driverUser)
    renderApp('/')
    await screen.findByRole('heading', { name: 'Usa la app móvil de Pikka' })
    const urls = fetchMock.mock.calls.map(([url]) => url)
    expect(urls.some((url) => url.endsWith('/ready'))).toBe(false)
  })

  it('el operador sí consulta el estado del sistema en Inicio', async () => {
    const fetchMock = mockAs(operatorUser)
    renderApp('/')
    expect(await screen.findByText('Backend disponible')).toBeInTheDocument()
    const urls = fetchMock.mock.calls.map(([url]) => url)
    expect(urls.some((url) => url.endsWith('/ready'))).toBe(true)
  })
})

describe('navegación del operador', () => {
  it('puede pasar de Inicio a Repartidores sin aviso', async () => {
    mockAs(operatorUser)
    renderApp('/')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('link', { name: 'Repartidores' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
