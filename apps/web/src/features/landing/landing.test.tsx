import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminUser, mockApi, renderApp } from '@/test/utils'
import { useSession } from '@/features/auth/session-store'

beforeEach(() => {
  useSession.getState().clear()
  mockApi(() => ({ status: 200, body: { products: [] } }))
})

describe('landing pública /inicio', () => {
  it('se muestra sin sesión con un único h1 y la estructura de cabecera y pie', () => {
    renderApp('/inicio')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Lo mejor de la ciudad, en tu puerta')
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('ofrece un enlace para saltar al contenido principal', () => {
    renderApp('/inicio')
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#contenido')
    expect(document.getElementById('contenido')?.tagName).toBe('MAIN')
  })

  it('la cabecera tiene buscador de catálogo, Rastrear y Mi cuenta', () => {
    renderApp('/inicio')
    const header = within(screen.getByRole('banner'))
    expect(header.getByRole('searchbox', { name: 'Buscar productos' })).toHaveAttribute('placeholder', 'Buscar productos…')
    expect(header.getByRole('link', { name: 'Rastrear' })).toHaveAttribute('href', '#rastreo')
    expect(header.getByRole('link', { name: 'Mi cuenta' })).toHaveAttribute('href', '/login')
  })

  it('no muestra datos inventados ni cifras fijas', () => {
    renderApp('/inicio')
    const text = document.body.textContent
    const banned = [
      /\b4\.9\b/,
      /\bMIN\b/,
      /\bMXN\b/,
      /CDMX|Santiago/,
      /App Store|Google Play/,
      /pik-cli/,
      /\bHub\b/,
      /PK-8942|PK-\d/,
      /DESPACHO ACTIVO/,
      /14 MIN|25–35|20–25/,
      /\bKM\b|°C/,
      /TLS/,
      /EDICIÓN OFICIAL/i,
      /MÁS PEDIDO/i,
      /googleusercontent/,
      /Pide tu entrega/,
    ]
    for (const pattern of banned) {
      expect(text, String(pattern)).not.toMatch(pattern)
    }
  })

  it('el hero enlaza al catálogo y a la sección de rastreo', () => {
    renderApp('/inicio')
    const hero = within(screen.getByRole('heading', { level: 1 }).closest('section') as HTMLElement)
    expect(hero.getByRole('link', { name: 'Explorar catálogo' })).toHaveAttribute('href', '#catalogo')
    expect(hero.getByRole('link', { name: 'Cómo funciona' })).toHaveAttribute('href', '#rastreo')
  })

  it('muestra tres colecciones que llevan al catálogo, sin precios', () => {
    renderApp('/inicio')
    for (const name of ['Ramos y arreglos', 'Cajas de regalo', 'Chocolates y galletas']) {
      expect(screen.getByRole('link', { name: new RegExp(name) })).toHaveAttribute('href', '#catalogo')
    }
  })

  it('explica el rastreo en tres pasos, sin datos en vivo, y enlaza a la cuenta', () => {
    renderApp('/inicio')
    const section = document.getElementById('rastreo') as HTMLElement
    for (const step of ['Sellado en almacén', 'Despacho en flota', 'Entrega con código PIN']) {
      expect(within(section).getByRole('heading', { level: 3, name: step })).toBeInTheDocument()
    }
    expect(within(section).getByRole('link', { name: 'Entra a tu cuenta para seguir tu pedido' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('tiene tres pilares de compromiso', () => {
    renderApp('/inicio')
    for (const title of ['Empaque isotérmico', 'Seguimiento de tu pedido', 'Atención de operadores']) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument()
    }
  })

  it('el pie muestra el año actual y no enlaza a tiendas ni a páginas inexistentes', () => {
    renderApp('/inicio')
    const footer = within(screen.getByRole('contentinfo'))
    expect(footer.getByText(`© ${String(new Date().getFullYear())} Pikka`)).toBeInTheDocument()
    expect(footer.queryByRole('link', { name: /App Store|Google Play/ })).not.toBeInTheDocument()
    expect(footer.queryByText(/Próximamente|CDMX|Santiago|TLS/)).not.toBeInTheDocument()
  })

  it('los botones con relleno de color llevan texto blanco', () => {
    renderApp('/inicio')
    const filled = [...document.querySelectorAll<HTMLElement>('a, button')].filter((el) =>
      /(^|\s)bg-(primary|secondary|primary-container)(\s|$)/.test(el.className),
    )
    expect(filled.length).toBeGreaterThan(2)
    for (const el of filled) expect(el.className, el.outerHTML.slice(0, 160)).toContain('text-white')
  })

  it('el buscador envía a #catalogo', async () => {
    renderApp('/inicio')
    const user = userEvent.setup()
    await user.type(screen.getByRole('searchbox', { name: 'Buscar productos' }), 'rosa{Enter}')
    expect(window.location.hash).toBe('#catalogo')
  })
})

describe('índice del sitio', () => {
  it('/ sin sesión muestra la landing, sin redirigir a /login', () => {
    const { router } = renderApp('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Lo mejor de la ciudad')
    expect(router.state.location.pathname).toBe('/')
  })

  it('/ con sesión sigue mostrando el back-office', async () => {
    useSession.getState().setToken('tok')
    mockApi((url) => (url.endsWith('/auth/me') ? { status: 200, body: adminUser } : { status: 200, body: { status: 'ready' } }))
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Hola, Ana Admin' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: /Lo mejor de la ciudad/ })).not.toBeInTheDocument()
  })

  it('/orders sin sesión redirige a /login', async () => {
    const { router } = renderApp('/orders')
    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })
  })
})
