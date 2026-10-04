import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'
import { createQueryClient } from '@/app/query-client'
import { routes } from '@/app/routes'

export function renderApp(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({ queries: { retry: false } })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { router }
}

type Handler = (url: string, init: RequestInit) => { status: number; body: unknown }

/** Sustituye fetch por un manejador que responde según método y ruta. */
export function mockApi(handler: Handler) {
  // El cliente HTTP siempre llama a fetch con la URL como string.
  const fn = vi.fn((input: string, init: RequestInit = {}) => {
    const { status, body } = handler(input, init)
    return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

export const adminUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'admin@example.com',
  fullName: 'Ana Admin',
  role: 'ADMIN',
  active: true,
  createdAt: '2026-10-03T00:00:00Z',
}

export const driverUser = { ...adminUser, id: '22222222-2222-2222-2222-222222222222', fullName: 'Diego Driver', role: 'DRIVER' }

export function apiError(status: number, code: string, message = 'error') {
  return { status, body: { error: { code, message, requestId: 'req-1' } } }
}

/** Cuerpo JSON enviado en una llamada registrada por mockApi. */
export function sentBody(init: RequestInit | undefined): unknown {
  return typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
}
