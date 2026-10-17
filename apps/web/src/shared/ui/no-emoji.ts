import { stripEmoji } from '@/shared/validation/contact'

/**
 * Ningún campo de texto admite emojis. Un solo listener en la captura limpia lo que se escribe o se pega y
 * reenvía el evento para que React vea el valor ya limpio.
 */
export function installNoEmoji(root: Document = document): () => void {
  const onInput = (event: Event) => {
    const target = event.target
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return
    const clean = stripEmoji(target.value)
    if (clean === target.value) return
    const proto = target instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(target, clean)
    event.stopImmediatePropagation()
    target.dispatchEvent(new Event('input', { bubbles: true }))
  }
  root.addEventListener('input', onInput, true)
  return () => { root.removeEventListener('input', onInput, true) }
}
