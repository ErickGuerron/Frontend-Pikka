import { useEffect, type RefObject } from 'react'

const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'

/**
 * Comportamiento común de los diálogos modales: foco inicial, Escape para cerrar (salvo `locked`),
 * Tab atrapado dentro y retorno del foco al disparador al desmontar.
 */
export function useDialog(
  dialogRef: RefObject<HTMLElement | null>,
  initialFocusRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  locked: boolean,
) {
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    initialFocusRef.current?.focus()
    return () => { opener?.focus() }
  }, [initialFocusRef])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !locked) onClose()
      if (event.key === 'Tab') trapFocus(event, dialogRef.current)
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [dialogRef, onClose, locked])
}

/** Mantiene el Tab dentro del diálogo: del último control al primero y viceversa. */
function trapFocus(event: KeyboardEvent, dialog: HTMLElement | null) {
  if (dialog === null) return
  const items = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
  const first = items[0]
  const last = items.at(-1)
  if (first === undefined || last === undefined) return
  const active = document.activeElement
  const outside = active === null || !dialog.contains(active)
  if (event.shiftKey && (outside || active === first)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (outside || active === last)) {
    event.preventDefault()
    first.focus()
  }
}
