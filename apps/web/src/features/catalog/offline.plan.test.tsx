import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { customerUser, renderApp } from '@/test/utils'

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('PLAN: offline behaviour', () => {
  it('catalog_fetchRejectsWithNetworkError_showsErrorStateInsteadOfCrashing_CurrentBehavior', async () => {
    // Session check succeeds; every product request fails like a dropped connection.
    vi.stubGlobal('fetch', vi.fn((input: string) =>
      input.endsWith('/auth/me')
        ? Promise.resolve(new Response(JSON.stringify(customerUser), { status: 200, headers: { 'Content-Type': 'application/json' } }))
        : Promise.reject(new TypeError('Failed to fetch')),
    ))
    renderApp('/catalogo')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No pudimos cargar el catálogo.')
    expect(alert).toHaveTextContent('No se pudo conectar con el servidor.')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.queryByText('Agua 1L')).not.toBeInTheDocument()
  })
})
