import { screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

/** Abre el stock de "Jugo de naranja", escribe el ajuste y registra el movimiento. */
export async function submitStockDelta(user: UserEvent, delta: string): Promise<void> {
  await user.click(await screen.findByRole('button', { name: 'Agregar stock de Jugo de naranja' }))
  await user.type(screen.getByLabelText('Cantidad (+ suma, - resta)'), delta)
  await user.click(screen.getByRole('button', { name: 'Registrar movimiento' }))
}
