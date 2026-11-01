import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollCarousel } from './ScrollCarousel'

const labels = {
  previous: 'Anterior',
  next: 'Siguiente',
  goTo: (position: number) => `Ir a la diapositiva ${String(position)}`,
}

function Carousel({ count = 3, autoplay = false }: { count?: number; autoplay?: boolean }) {
  return (
    <>
      <h2 id="carousel-title">Destacados</h2>
      <ScrollCarousel labelledBy="carousel-title" labels={labels} autoplay={autoplay}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} role="group" aria-roledescription="slide">
            Diapositiva {i + 1}
          </div>
        ))}
      </ScrollCarousel>
    </>
  )
}

function track() {
  return screen.getByTestId('carousel-track')
}

function slideElements() {
  return Array.from(track().children) as HTMLElement[]
}

/** Dimensiones de scroll que jsdom no calcula: cada diapositiva en su posición real. */
function layoutSlides(offsets: number[]) {
  slideElements().forEach((slide, i) => {
    Object.defineProperty(slide, 'offsetLeft', { configurable: true, value: offsets[i] ?? 0 })
  })
}

function setScrollState(state: { scrollLeft: number; clientWidth: number; scrollWidth: number }) {
  const element = track()
  Object.defineProperty(element, 'scrollLeft', { configurable: true, value: state.scrollLeft })
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: state.clientWidth })
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: state.scrollWidth })
}

function activeIndicator() {
  return screen.getAllByRole('button', { name: /Ir a la diapositiva/ }).findIndex((b) => b.getAttribute('aria-current') === 'true')
}

beforeEach(() => {
  vi.useRealTimers()
})

afterEach(() => {
  vi.useRealTimers()
  Reflect.deleteProperty(window, 'matchMedia')
})

describe('ScrollCarousel: navegación manual', () => {
  it('nombra la región con el encabezado, marca la diapositiva activa y bloquea Anterior al inicio', () => {
    render(<Carousel />)

    expect(screen.getByRole('region', { name: 'Destacados' })).toHaveAttribute('aria-roledescription', 'carrusel')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled()
    expect(activeIndicator()).toBe(0)
  })

  it('Siguiente y Anterior mueven una diapositiva y llaman a scrollTo con el desplazamiento de la diapositiva', async () => {
    const user = userEvent.setup()
    render(<Carousel />)
    const scrollTo = vi.fn()
    track().scrollTo = scrollTo
    layoutSlides([0, 320, 640])

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(activeIndicator()).toBe(1)
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 320, behavior: 'auto' })

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(activeIndicator()).toBe(0)
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: 'auto' })
  })

  it('Siguiente se bloquea en la última diapositiva', async () => {
    const user = userEvent.setup()
    render(<Carousel count={2} />)

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(activeIndicator()).toBe(1)
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
  })

  it('un indicador lleva a su diapositiva y los botones de teclado (Tab + Enter) mueven el carrusel', async () => {
    const user = userEvent.setup()
    render(<Carousel />)

    await user.click(screen.getByRole('button', { name: 'Ir a la diapositiva 3' }))
    expect(activeIndicator()).toBe(2)

    screen.getByRole('button', { name: 'Anterior' }).focus()
    await user.keyboard('{Enter}')
    expect(activeIndicator()).toBe(1)
    screen.getByRole('button', { name: 'Siguiente' }).focus()
    await user.keyboard('{Enter}')
    expect(activeIndicator()).toBe(2)
  })

  it('sin diapositivas no muestra indicadores y deshabilita las flechas', () => {
    render(<Carousel count={0} />)

    expect(screen.queryAllByRole('button', { name: /Ir a la diapositiva/ })).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
  })
})

describe('ScrollCarousel: scroll nativo o táctil', () => {
  it('al desplazarse, la diapositiva más cercana queda activa y al final se bloquea Siguiente', () => {
    render(<Carousel />)
    layoutSlides([0, 320, 640])

    setScrollState({ scrollLeft: 330, clientWidth: 300, scrollWidth: 940 })
    fireEvent.scroll(track())
    expect(activeIndicator()).toBe(1)
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled()

    setScrollState({ scrollLeft: 640, clientWidth: 300, scrollWidth: 940 })
    fireEvent.scroll(track())
    expect(activeIndicator()).toBe(2)
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
  })

  it('un scroll sin diapositivas no cambia el estado', () => {
    render(<Carousel count={0} />)
    setScrollState({ scrollLeft: 0, clientWidth: 300, scrollWidth: 300 })
    fireEvent.scroll(track())
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
  })
})

describe('ScrollCarousel: reproducción automática', () => {
  function enableMotion(reduced: boolean) {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    })
  }

  it('no ofrece el control de reproducción sin autoplay ni con movimiento reducido', () => {
    enableMotion(false)
    const { unmount } = render(<Carousel />)
    expect(screen.queryByRole('button', { name: /reproducción automática/ })).toBeNull()
    unmount()

    enableMotion(true)
    render(<Carousel autoplay />)
    expect(screen.queryByRole('button', { name: /reproducción automática/ })).toBeNull()
  })

  it('avanza cada 5 segundos, vuelve al inicio al llegar al final y se pausa con el botón', () => {
    enableMotion(false)
    vi.useFakeTimers()
    render(<Carousel count={2} autoplay />)

    act(() => { vi.advanceTimersByTime(5000) })
    expect(activeIndicator()).toBe(1)

    act(() => { vi.advanceTimersByTime(5000) })
    expect(activeIndicator()).toBe(0)

    fireEvent.click(screen.getByRole('button', { name: 'Pausar reproducción automática' }))
    expect(screen.getByRole('button', { name: 'Reanudar reproducción automática' })).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(10000) })
    expect(activeIndicator()).toBe(0)

    fireEvent.click(screen.getByRole('button', { name: 'Reanudar reproducción automática' }))
    act(() => { vi.advanceTimersByTime(5000) })
    expect(activeIndicator()).toBe(1)
  })

  it('se pausa mientras el cursor está encima, y reanuda al salir', () => {
    enableMotion(false)
    vi.useFakeTimers()
    render(<Carousel autoplay />)
    const region = screen.getByRole('region', { name: 'Destacados' })

    fireEvent.mouseEnter(region)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(activeIndicator()).toBe(0)

    fireEvent.mouseLeave(region)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(activeIndicator()).toBe(1)
  })

  it('se pausa al enfocar un control dentro del carrusel y reanuda cuando el foco sale', () => {
    enableMotion(false)
    vi.useFakeTimers()
    render(<Carousel autoplay />)
    const region = screen.getByRole('region', { name: 'Destacados' })
    const next = screen.getByRole('button', { name: 'Siguiente' })

    fireEvent.focus(next)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(activeIndicator()).toBe(0)

    // Foco que se mueve a otro control del mismo carrusel: sigue pausado.
    fireEvent.blur(next, { relatedTarget: screen.getByRole('button', { name: 'Anterior' }) })
    act(() => { vi.advanceTimersByTime(5000) })
    expect(activeIndicator()).toBe(0)

    // Foco que sale del carrusel: se reanuda.
    fireEvent.blur(screen.getByRole('button', { name: 'Anterior' }), { relatedTarget: document.body })
    act(() => { vi.advanceTimersByTime(5000) })
    expect(activeIndicator()).toBe(1)
    expect(region).toBeInTheDocument()
  })
})
