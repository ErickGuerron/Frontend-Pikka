import { describe, expect, it } from 'vitest'

/** Fuentes de la landing (sin pruebas). Se leen como texto para vigilar reglas de CSS y de clases. */
const sources = Object.entries(
  import.meta.glob<string>('./*.{ts,tsx,css}', { query: '?raw', import: 'default', eager: true }),
).filter(([path]) => !path.includes('.test.'))

describe('estilos de la landing', () => {
  it('ningún archivo usa transition: all', () => {
    for (const [path, text] of sources) {
      expect(text, path).not.toMatch(/transition:\s*all|\btransition-all\b/)
    }
  })

  it('outline-none solo aparece con un anillo de foco de reemplazo', () => {
    for (const [path, text] of sources) {
      for (const line of text.split('\n').filter((l) => /outline-none|outline:\s*none/.test(l))) {
        expect(line, path).toMatch(/ring-/)
      }
    }
  })
})
