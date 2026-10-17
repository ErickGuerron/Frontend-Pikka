import { afterEach, beforeEach, expect, it } from 'vitest'
import { installNoEmoji } from './no-emoji'

let uninstall: () => void
beforeEach(() => { uninstall = installNoEmoji() })
afterEach(() => { uninstall(); document.body.innerHTML = '' })

it('limpia los emojis de input y textarea y avisa con el valor limpio', () => {
  const seen: string[] = []
  for (const tag of ['input', 'textarea'] as const) {
    const el = document.createElement(tag)
    document.body.appendChild(el)
    el.addEventListener('input', () => { seen.push(el.value) })
    el.value = 'Ana 😀 Pérez 👨‍👩‍👧'
    el.dispatchEvent(new Event('input', { bubbles: true }))
    expect(el.value).toBe('Ana  Pérez ')
  }
  expect(seen).toEqual(['Ana  Pérez ', 'Ana  Pérez '])
})
