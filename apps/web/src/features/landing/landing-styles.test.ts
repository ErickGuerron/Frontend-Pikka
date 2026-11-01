import { describe, expect, it } from 'vitest'

/** Fuentes de la landing (sin pruebas). Se leen como texto para vigilar reglas de CSS y de clases. */
const sources = Object.entries(
  import.meta.glob<string>('./*.{ts,tsx,css}', { query: '?raw', import: 'default', eager: true }),
).filter(([path]) => !path.includes('.test.'))

const components = sources.filter(([path]) => /\.tsx?$/.test(path))

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

  it('los tonos de marca se referencian como variables CSS, no como hex en los componentes', () => {
    for (const [path, text] of components) {
      expect(text, path).not.toMatch(/#14b8a6|#004b4e/i)
    }
    const brand = components.find(([path]) => path.endsWith('Brand.tsx'))?.[1] ?? ''
    expect(brand).toContain('var(--landing-accent)')
  })

  it('ninguna imagen se hotlinkea desde googleusercontent', () => {
    for (const [path, text] of sources) {
      expect(text, path).not.toMatch(/googleusercontent/)
    }
  })
})
