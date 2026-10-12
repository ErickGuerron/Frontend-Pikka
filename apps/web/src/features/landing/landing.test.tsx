import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderApp } from '@/test/utils'
import { useSession } from '@/features/auth/session-store'

beforeEach(() => {
  useSession.getState().clear()
})

describe('landing pública /inicio', () => {
  it('se muestra sin sesión con un único h1', () => {
    renderApp('/inicio')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pide tu entrega')
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('la cabecera enlaza al login, al registro y a Servicios', () => {
    renderApp('/inicio')
    const header = within(screen.getByRole('banner'))
    expect(header.getByRole('link', { name: 'Iniciar Sesión' })).toHaveAttribute('href', '/login')
    expect(header.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/login?modo=registro')
    expect(header.getByRole('link', { name: 'Servicios' })).toHaveAttribute('href', '#servicios')
    expect(screen.queryByText(/Catálogo/)).not.toBeInTheDocument()
  })

  it('no promete productos, medicinas ni garantías de manejo', () => {
    renderApp('/inicio')
    const text = document.body.textContent
    for (const banned of [/medicament/i, /cadena de fr/i, /originales/i, /pastel/i, /gadgets/i, /Ver Productos/]) {
      expect(text).not.toMatch(banned)
    }
  })

  it('las preguntas frecuentes se abren y cierran', async () => {
    renderApp('/inicio')
    const user = userEvent.setup()
    const q = screen.getByRole('button', { name: '¿Cómo hago un pedido?', expanded: false })
    await user.click(q)
    expect(q).toHaveAttribute('aria-expanded', 'true')
    await user.click(q)
    expect(q).toHaveAttribute('aria-expanded', 'false')
  })

  it('los botones con relleno de color llevan texto blanco', () => {
    renderApp('/inicio')
    const ctas = [
      screen.getByRole('link', { name: 'Iniciar Sesión' }),
      screen.getByRole('link', { name: 'Ver qué ofrece Pikka' }),
    ]
    for (const el of ctas) expect(el).toHaveClass('text-white')
    // Generic guard: any colored-fill control in the page must carry text-white.
    // Dot indicators are text-less, so they are excluded.
    const filled = [...document.querySelectorAll<HTMLElement>('a, button:not([aria-current]):not([aria-label^="Ir a"])')].filter((el) =>
      /(^|\s)bg-(primary|secondary|primary-container)(\s|$)/.test(el.className),
    )
    expect(filled.length).toBeGreaterThan(1)
    for (const el of filled) expect(el.className).toContain('text-white')
  })
})
