import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '@/test/utils'
import { useSession } from '@/features/auth/session-store'
import { Carousel } from './Carousel'

beforeEach(() => {
  useSession.getState().clear()
})

const dotsQuery = { name: /^Ir a la diapositiva/ }

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

  it('el buscador rápido usa los campos reales del pedido y lleva al registro', async () => {
    renderApp('/inicio')
    const user = userEvent.setup()
    const address = screen.getByLabelText('Tu dirección de entrega')
    const windowSelect = screen.getByLabelText('Ventana de entrega')
    expect(address).toHaveValue('')
    expect(windowSelect).toHaveValue('')
    expect(within(windowSelect).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Elige una ventana',
      '09:00 – 12:00',
      '12:00 – 15:00',
      '15:00 – 18:00',
      '18:00 – 21:00',
    ])
    await user.type(address, 'Calle 1 #2')
    await user.selectOptions(windowSelect, '12-15')
    expect(address).toHaveValue('Calle 1 #2')
    expect(windowSelect).toHaveValue('12-15')
    expect(screen.getByRole('link', { name: 'Crear pedido' })).toHaveAttribute('href', '/login?modo=registro')
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
      screen.getByRole('link', { name: 'Crear pedido' }),
      screen.getByRole('button', { name: 'Siguiente' }),
      screen.getByRole('button', { name: 'Anterior' }),
    ]
    for (const el of ctas) expect(el).toHaveClass('text-white')
    // Generic guard: any colored-fill control in the page must carry text-white.
    // Dot indicators are text-less, so they are excluded.
    const filled = [...document.querySelectorAll<HTMLElement>('a, button:not([aria-current]):not([aria-label^="Ir a"])')].filter((el) =>
      /(^|\s)bg-(primary|secondary|primary-container)(\s|$)/.test(el.className),
    )
    expect(filled.length).toBeGreaterThan(3)
    for (const el of filled) expect(el.className).toContain('text-white')
  })
})

describe('carrusel de servicios', () => {
  it('expone la semántica de carrusel y diapositivas "n de total"', () => {
    renderApp('/inicio')
    const region = screen.getByRole('region', { name: '¿Qué puedes hacer con Pikka?' })
    expect(region).toHaveAttribute('aria-roledescription', 'carousel')
    const slides = within(region)
      .getAllByRole('group')
      .filter((g) => g.getAttribute('aria-roledescription') === 'slide')
    expect(slides).toHaveLength(6)
    expect(slides[0]).toHaveAccessibleName('1 de 6')
    expect(slides[5]).toHaveAccessibleName('6 de 6')
    const windowSlide = within(slides[1] as HTMLElement)
    expect(windowSlide.getByText('09–12')).toBeInTheDocument()
    expect(windowSlide.getByText('18–21')).toBeInTheDocument()
  })

  it('los botones y los puntos cambian la diapositiva activa', async () => {
    renderApp('/inicio')
    const user = userEvent.setup()
    const dots = screen.getAllByRole('button', dotsQuery)
    expect(dots).toHaveLength(6)
    expect(dots[0]).toHaveAttribute('aria-current', 'true')
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(dots[1]).toHaveAttribute('aria-current', 'true')
    expect(dots[0]).not.toHaveAttribute('aria-current')
    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(dots[0]).toHaveAttribute('aria-current', 'true')
    await user.click(dots[4] as HTMLElement)
    expect(dots[4]).toHaveAttribute('aria-current', 'true')
  })

  it('las flechas del teclado mueven el carrusel', async () => {
    renderApp('/inicio')
    const user = userEvent.setup()
    screen.getByTestId('carousel-track').focus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getAllByRole('button', dotsQuery)[2]).toHaveAttribute('aria-current', 'true')
    await user.keyboard('{ArrowLeft}')
    expect(screen.getAllByRole('button', dotsQuery)[1]).toHaveAttribute('aria-current', 'true')
  })
})

describe('autoplay del carrusel', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  function stubMedia(reduce: boolean) {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce, media: query }))
  }

  it('avanza solo y se pausa al pasar el cursor', () => {
    vi.useFakeTimers()
    stubMedia(false)
    render(<Carousel />)
    act(() => {
      vi.advanceTimersByTime(6000)
    })
    expect(screen.getAllByRole('button', dotsQuery)[1]).toHaveAttribute('aria-current', 'true')
    fireEvent.mouseEnter(screen.getByRole('region', { name: '¿Qué puedes hacer con Pikka?' }))
    act(() => {
      vi.advanceTimersByTime(20000)
    })
    expect(screen.getAllByRole('button', dotsQuery)[1]).toHaveAttribute('aria-current', 'true')
  })

  it('no se activa con prefers-reduced-motion', () => {
    vi.useFakeTimers()
    stubMedia(true)
    render(<Carousel />)
    act(() => {
      vi.advanceTimersByTime(20000)
    })
    expect(screen.getAllByRole('button', dotsQuery)[0]).toHaveAttribute('aria-current', 'true')
  })
})
