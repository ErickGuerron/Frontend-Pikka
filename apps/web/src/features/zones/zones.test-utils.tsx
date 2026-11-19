import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import type { ReactElement } from 'react'

/** Renderiza dentro de un QueryClient sin reintentos, igual que en la app de pruebas. */
export function renderWithQueryClient(ui: ReactElement): QueryClient {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
  return client
}

/** Abre la pestaña de zonas registradas y entra al redibujo de la zona indicada. */
export async function startRedrawFromList(user: UserEvent, buttonName = 'Redibujar CENTRO-001'): Promise<void> {
  await user.click(screen.getByRole('tab', { name: /Zonas registradas/ }))
  await user.click(await screen.findByRole('button', { name: buttonName }))
}
