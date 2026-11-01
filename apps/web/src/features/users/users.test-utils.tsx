import { screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

/** Abre el modal "Nuevo Usuario" y devuelve el diálogo de creación. */
export async function openCreateDialog(user: UserEvent): Promise<HTMLElement> {
  await user.click(await screen.findByRole('button', { name: 'Nuevo Usuario' }))
  return screen.getByRole('dialog', { name: 'Crear Nuevo Usuario' })
}

/** Abre el modal de edición de Diego Driver (lápiz de la fila) y devuelve el diálogo. */
export async function openEditDialog(user: UserEvent): Promise<HTMLElement> {
  await user.click(await screen.findByRole('button', { name: 'Editar usuario Diego Driver' }))
  return screen.getByRole('dialog', { name: 'Editar Usuario' })
}

/** El fondo es el primer hijo del panel del diálogo: un clic ahí equivale a pulsar fuera del modal. */
export function backdropOf(dialog: HTMLElement): HTMLElement {
  const backdrop = dialog.querySelector<HTMLElement>(':scope > [aria-hidden="true"]')
  if (backdrop === null) throw new Error('el diálogo no tiene fondo')
  return backdrop
}
