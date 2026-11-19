import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, mockApi, renderApp } from '@/test/utils'

beforeEach(() => {
  useSession.getState().setToken('tok')
  mockApi((url) => (url.endsWith('/api/v1/users') ? { status: 200, body: { users: [] } } : { status: 200, body: adminUser }))
})

it('el header no muestra el chip "Hub Central Pikka"', async () => {
  renderApp('/users')
  expect(await screen.findByRole('button', { name: `Menú de cuenta de ${adminUser.fullName}` })).toBeInTheDocument()
  expect(screen.queryByText(/Hub Central Pikka/)).toBeNull()
  expect(screen.queryByText('local_shipping')).toBeNull()
})

it('el avatar abre un menú con "Cerrar sesión" y Escape lo cierra devolviendo el foco', async () => {
  renderApp('/users')
  const user = userEvent.setup()
  const avatar = await screen.findByRole('button', { name: `Menú de cuenta de ${adminUser.fullName}` })

  expect(avatar).toHaveAttribute('aria-haspopup', 'menu')
  expect(avatar).toHaveAttribute('aria-expanded', 'false')
  await user.click(avatar)
  expect(avatar).toHaveAttribute('aria-expanded', 'true')
  const menu = screen.getByRole('menu')
  expect(within(menu).getByRole('menuitem', { name: 'Cerrar sesión' })).toBeInTheDocument()

  await user.keyboard('{Escape}')
  expect(screen.queryByRole('menu')).toBeNull()
  expect(avatar).toHaveFocus()
})

it('clic en "Cerrar sesión" del menú cierra la sesión', async () => {
  renderApp('/users')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: `Menú de cuenta de ${adminUser.fullName}` }))
  await user.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }))

  expect(useSession.getState().token).toBeNull()
})

it('clic fuera cierra el menú y las flechas mueven el foco entre elementos', async () => {
  renderApp('/users')
  const user = userEvent.setup()
  const avatar = await screen.findByRole('button', { name: `Menú de cuenta de ${adminUser.fullName}` })
  await user.click(avatar)
  const item = screen.getByRole('menuitem', { name: 'Cerrar sesión' })
  expect(item).toHaveFocus()
  await user.keyboard('{ArrowDown}')
  expect(item).toHaveFocus()
  await user.keyboard('{ArrowUp}')
  expect(item).toHaveFocus()

  await user.click(document.body)
  expect(screen.queryByRole('menu')).toBeNull()
})
