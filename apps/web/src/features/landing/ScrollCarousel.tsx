import { Children, useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

const AUTOPLAY_MS = 5000

export const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2'
const arrow = `inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`

/** Autoplay solo si el usuario no pide movimiento reducido. */
function motionAllowed(): boolean {
  return typeof window.matchMedia === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export interface ScrollCarouselProps {
  /** id del encabezado que nombra la región. */
  labelledBy: string
  labels: { previous: string; next: string; goTo: (position: number) => string }
  /** Autoplay opt-in; se pausa al pasar el cursor, al enfocar o con el botón visible. */
  autoplay?: boolean
  /** Cada hijo es una diapositiva (direct child del track). */
  children: ReactNode
}

/** Carrusel sin dependencias: scroll-snap nativo, teclado, botones e indicadores. */
export function ScrollCarousel({ labelledBy, labels, autoplay = false, children }: ScrollCarouselProps) {
  const count = Children.count(children)
  const last = Math.max(count - 1, 0)
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [canAutoplay] = useState(() => autoplay && motionAllowed())
  const index = Math.min(active, last)

  const goTo = useCallback(
    (position: number) => {
      const next = Math.min(Math.max(position, 0), last)
      setActive(next)
      const track = trackRef.current
      const slide = track?.children[next]
      if (track && slide instanceof HTMLElement && typeof track.scrollTo === 'function') {
        track.scrollTo({ left: slide.offsetLeft, behavior: canAutoplay ? 'smooth' : 'auto' })
      }
    },
    [last, canAutoplay],
  )

  // Scroll nativo o táctil: la diapositiva activa sale de la posición de scroll.
  const onScroll = () => {
    const track = trackRef.current
    if (!track) return
    let nearest = 0
    let best = Infinity
    Array.from(track.children).forEach((child, i) => {
      if (!(child instanceof HTMLElement)) return
      const distance = Math.abs(child.offsetLeft - track.scrollLeft)
      if (distance < best) {
        best = distance
        nearest = i
      }
    })
    setActive(nearest)
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 2)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      goTo(index + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goTo(index - 1)
    }
  }

  const paused = hovered || focused || !playing
  useEffect(() => {
    if (!canAutoplay || paused) return
    const id = window.setInterval(() => {
      goTo(index >= last || atEnd ? 0 : index + 1)
    }, AUTOPLAY_MS)
    return () => {
      window.clearInterval(id)
    }
  }, [canAutoplay, paused, index, atEnd, last, goTo])

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-labelledby={labelledBy}
      onMouseEnter={() => {
        setHovered(true)
      }}
      onMouseLeave={() => {
        setHovered(false)
      }}
      onFocus={() => {
        setFocused(true)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
      }}
    >
      <div
        ref={trackRef}
        data-testid="carousel-track"
        tabIndex={0}
        aria-live={paused ? 'polite' : 'off'}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        className={`landing-track relative flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth rounded-2xl pb-2 ${focusRing}`}
      >
        {children}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button type="button" aria-label={labels.previous} disabled={index === 0} onClick={() => { goTo(index - 1) }} className={arrow}>
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={labels.goTo(i + 1)}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => {
                goTo(i)
              }}
              className={`h-2.5 rounded-full transition-colors ${focusRing} ${i === index ? 'w-6 bg-primary' : 'w-2.5 bg-outline-variant hover:bg-outline'}`}
            />
          ))}
        </div>
        <button type="button" aria-label={labels.next} disabled={index === last || atEnd} onClick={() => { goTo(index + 1) }} className={arrow}>
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </button>
        {canAutoplay ? (
          <button
            type="button"
            aria-label={playing ? 'Pausar reproducción automática' : 'Reanudar reproducción automática'}
            onClick={() => {
              setPlaying((p) => !p)
            }}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface-container ${focusRing}`}
          >
            {playing ? <Pause aria-hidden="true" className="h-5 w-5" /> : <Play aria-hidden="true" className="h-5 w-5" />}
          </button>
        ) : null}
      </div>
    </div>
  )
}
