import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, apiError, customerUser, mockApi, renderApp } from '@/test/utils'

const operatorUser = { ...adminUser, id: '66666666-6666-6666-6666-666666666666', role: 'OPERATOR' }
const water = {
  id: '44444444-4444-4444-4444-444444444444',
  name: 'Agua 1L',
  description: 'Botella de vidrio',
  unitPrice: '2.50',
  active: true,
  stockQuantity: 10,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
}

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('PLAN: catalog product creation rejected by the server', () => {
  it('createProduct_serverReturns409_showsGenericConflictErrorAndKeepsTheForm_CurrentBehavior', async () => {
    const fetchMock = mockApi((url, init) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: operatorUser }
      if (url.includes('/api/v1/products') && init.method === 'POST') return apiError(409, 'CONFLICT', 'product name already exists')
      if (url.includes('/api/v1/products')) return { status: 200, body: { products: [water] } }
      return { status: 200, body: {} }
    })
    renderApp('/productos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Nuevo producto' }))
    await user.type(screen.getByLabelText('Nombre'), 'Agua 1L')
    await user.type(screen.getByLabelText('Precio (USD)'), '2.50')
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))

    // Current behaviour: a generic CONFLICT message (no product-specific text); the dialog stays open.
    expect(await screen.findByText('Ya existe un registro con esos datos.')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Nuevo producto' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Agua 1L')
    expect(screen.getByLabelText('Precio (USD)')).toHaveValue('2.50')
    expect(screen.queryByText(/creado\./)).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1)
  })
})

describe('PLAN: catalog search without results', () => {
  it('search_nonexistentProduct_showsExplicitEmptyStateAndNoProductCards', async () => {
    mockApi((url) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: customerUser }
      if (url.includes('/api/v1/products')) return { status: 200, body: { products: [water] } }
      return { status: 200, body: {} }
    })
    renderApp('/catalogo')
    const user = userEvent.setup()

    expect(await screen.findByText('Agua 1L')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Buscar productos'), 'Inexistente')

    expect(screen.getByText('Ningún producto coincide con “Inexistente”.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Quitar filtro' })).toBeInTheDocument()
    expect(screen.queryByText('Agua 1L')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Realizar pedido de/ })).not.toBeInTheDocument()
  })
})
