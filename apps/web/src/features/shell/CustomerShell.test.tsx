import { QueryClient, QueryClientProvider, type QueryClient as Client } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { currentUserKey } from '@/features/auth/hooks'
import { useSession } from '@/features/auth/session-store'
import { customerUser } from '@/test/utils'
import { CustomerNavbar } from './CustomerNavbar'
import { CustomerSidebar } from './CustomerSidebar'
import { CustomerTopbar } from './CustomerTopbar'

/** Con token y usuario ya en caché no hay petición de red: useCurrentUser usa el dato sembrado. */
function withSession(ui: ReactNode, route = '/mis-pedidos') {
  const queryClient: Client = new QueryClient()
  queryClient.setQueryData(currentUserKey, customerUser)
  useSession.getState().setToken('tok')
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  useSession.getState().clear()
})

afterEach(() => {
  useSession.getState().clear()
})

describe('menú lateral del cliente', () => {
  it('muestra el nombre y la inicial del cliente y sus secciones con enlaces', () => {
    withSession(<CustomerSidebar open={false} onClose={vi.fn()} />)

    expect(screen.getByRole('complementary', { name: 'Menú de cliente' })).toBeInTheDocument()
    expect(screen.getByText('Carla Cliente')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Secciones' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/mis-pedidos', '/catalogo'])
  })

  it('al elegir una sección cierra el menú', async () => {
    const onClose = vi.fn()
    withSession(<CustomerSidebar open onClose={onClose} />)
    const user = userEvent.setup()

    await user.click(within(screen.getByRole('navigation', { name: 'Secciones' })).getAllByRole('link')[1] as HTMLElement)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('con el menú abierto en móvil, el fondo oscuro también lo cierra', () => {
    const onClose = vi.fn()
    const { container } = withSession(<CustomerSidebar open onClose={onClose} />)
    const backdrop = container.querySelector('.fixed.inset-0[aria-hidden="true"]')
    expect(backdrop).not.toBeNull()

    fireEvent.click(backdrop as Element)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('cerrado, no muestra el fondo oscuro y la barra queda fuera de la pantalla', () => {
    const { container } = withSession(<CustomerSidebar open={false} onClose={vi.fn()} />)

    expect(container.querySelector('.fixed.inset-0[aria-hidden="true"]')).toBeNull()
    expect(screen.getByRole('complementary', { name: 'Menú de cliente' })).toHaveClass('-translate-x-full')
  })

  it('Cerrar sesión limpia la sesión', async () => {
    withSession(<CustomerSidebar open={false} onClose={vi.fn()} />)
    const user = userEvent.setup()
    expect(useSession.getState().token).toBe('tok')

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(useSession.getState().token).toBeNull()
  })

  it('sin usuario cargado muestra "Cargando…" y el avatar vacío', () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CustomerSidebar open={false} onClose={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(screen.getByText('Cargando…')).toBeInTheDocument()
  })
})

describe('barra superior del cliente', () => {
  it('muestra el nombre, el correo y la inicial del cliente', () => {
    withSession(<CustomerTopbar onMenu={vi.fn()} />)

    expect(screen.getByText('Carla Cliente')).toBeInTheDocument()
    expect(screen.getByText('cliente@example.com')).toBeInTheDocument()
  })

  it('el botón Abrir menú llama a onMenu', async () => {
    const onMenu = vi.fn()
    withSession(<CustomerTopbar onMenu={onMenu} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))

    expect(onMenu).toHaveBeenCalledTimes(1)
  })
})

describe('barra de navegación del cliente: menú móvil', () => {
  it('Abrir menú despliega las secciones y elegir una las cierra', async () => {
    withSession(<CustomerNavbar />)
    const user = userEvent.setup()
    expect(screen.queryByRole('navigation', { name: 'Secciones móviles' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
    const drawer = screen.getByRole('navigation', { name: 'Secciones móviles' })
    await user.click(within(drawer).getByRole('link', { name: /Catálogo/ }))

    expect(screen.queryByRole('navigation', { name: 'Secciones móviles' })).toBeNull()
  })

  it('el botón del menú alterna entre abrir y cerrar', async () => {
    withSession(<CustomerNavbar />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
    expect(screen.getByRole('navigation', { name: 'Secciones móviles' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
    expect(screen.queryByRole('navigation', { name: 'Secciones móviles' })).toBeNull()
  })

  it('en el menú móvil, Mis Pedidos también cierra el menú', async () => {
    withSession(<CustomerNavbar />, '/catalogo')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
    await user.click(within(screen.getByRole('navigation', { name: 'Secciones móviles' })).getByRole('link', { name: /Mis Pedidos/ }))

    expect(screen.queryByRole('navigation', { name: 'Secciones móviles' })).toBeNull()
  })

  it('Cerrar sesión desde la barra limpia la sesión', async () => {
    withSession(<CustomerNavbar />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(useSession.getState().token).toBeNull()
  })
})
