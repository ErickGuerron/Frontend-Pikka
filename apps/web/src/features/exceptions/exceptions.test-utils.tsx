import { screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

/** Pulsa "Revisar" en la primera excepción de la cola; la carga puede tardar en la app de pruebas. */
export async function openReview(user: UserEvent): Promise<void> {
  await user.click(await screen.findByRole('button', { name: 'Revisar' }, { timeout: 5000 }))
}
