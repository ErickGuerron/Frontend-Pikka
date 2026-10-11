import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import pikkaMascot from '@/assets/pikka.png'
import { SLIDES } from './data'

const AUTOPLAY_MS = 5000
const TITLE = '¿Qué puedes hacer con Pikka?'

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2'
const arrow = `inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-40 ${focus}`

/** Autoplay is opt-in by environment: only when the user does not ask for reduced motion. */
function motionAllowed(): boolean {
  return typeof window.matchMedia === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Services carousel: CSS scroll-snap track, no dependencies. */
export function Carousel() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [canAutoplay] = useState(motionAllowed)
  const last = SLIDES.length - 1

  const goTo = useCallback(
    (index: number) => {
      const next = Math.min(Math.max(index, 0), last)
      setActive(next)
      const track = trackRef.current
      const slide = track?.children[next]
      if (track && slide instanceof HTMLElement && typeof track.scrollTo === 'function') {
        track.scrollTo({ left: slide.offsetLeft, behavior: canAutoplay ? 'smooth' : 'auto' })
      }
    },
    [last, canAutoplay],
  )

  // Native swipe/scroll: derive the active slide from the scroll position.
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
      goTo(active + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goTo(active - 1)
    }
  }

  const paused = hovered || focused || !playing
  useEffect(() => {
    if (!canAutoplay || paused) return
    const id = window.setInterval(() => {
      goTo(active >= last || atEnd ? 0 : active + 1)
    }, AUTOPLAY_MS)
    return () => {
      window.clearInterval(id)
    }
  }, [canAutoplay, paused, active, atEnd, last, goTo])

  return (
    <section id="servicios" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full bg-secondary-fixed px-3 py-1 text-xs font-bold tracking-wide text-on-secondary-container">
            NUESTROS SERVICIOS
          </p>
          <h2 id="servicios-titulo" className="mt-4 text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
            {TITLE}
          </h2>
          <p className="mt-3 text-base leading-6 text-on-surface-variant">
            Pikka es un servicio de entregas: creas tu pedido, eliges tu ventana y lo sigues hasta tu puerta.
          </p>
        </div>

        <div
          role="region"
          aria-roledescription="carousel"
          aria-labelledby="servicios-titulo"
          className="mt-10"
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
            className={`landing-track relative flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth rounded-2xl pb-2 ${focus}`}
          >
            {SLIDES.map((slide, i) => {
              const Icon = slide.icon
              return (
                <div
                  key={slide.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${String(i + 1)} de ${String(SLIDES.length)}`}
                  className="flex shrink-0 basis-full snap-start flex-col overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-sm md:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)]"
                >
                  <div className={`relative flex h-44 items-center justify-center bg-gradient-to-br ${slide.gradient}`}>
                    <span className="rounded-full bg-white/80 p-6 text-primary shadow-md">
                      <Icon aria-hidden="true" className="h-12 w-12" />
                    </span>
                    {slide.mascot ? (
                      <img
                        src={pikkaMascot}
                        alt=""
                        aria-hidden="true"
                        className="absolute bottom-0 right-3 h-28 w-28 object-contain drop-shadow-lg"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-bold">{slide.title}</h3>
                    <p className="mt-2 text-base leading-6 text-on-surface-variant">{slide.text}</p>
                    {slide.chips ? (
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {slide.chips.map((chip) => (
                          <li key={chip} className="rounded-full bg-primary-fixed px-3 py-1 text-sm font-semibold text-primary">
                            {chip}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <dl className="mt-4 space-y-2 border-t border-outline-variant/50 pt-4 text-sm">
                      {slide.details.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3">
                          <dt className="text-on-surface-variant">{k}</dt>
                          <dd className="text-right font-semibold">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Anterior"
              disabled={active === 0}
              onClick={() => {
                goTo(active - 1)
              }}
              className={arrow}
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5 text-white" />
            </button>
            <div className="flex items-center gap-2">
              {SLIDES.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Ir a la diapositiva ${String(i + 1)}`}
                  aria-current={i === active ? 'true' : undefined}
                  onClick={() => {
                    goTo(i)
                  }}
                  className={`h-2.5 rounded-full transition-all ${focus} ${
                    i === active ? 'w-6 bg-primary' : 'w-2.5 bg-outline-variant hover:bg-outline'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Siguiente"
              disabled={active === last || atEnd}
              onClick={() => {
                goTo(active + 1)
              }}
              className={arrow}
            >
              <ChevronRight aria-hidden="true" className="h-5 w-5 text-white" />
            </button>
            {canAutoplay ? (
              <button
                type="button"
                aria-label={playing ? 'Pausar reproducción automática' : 'Reanudar reproducción automática'}
                onClick={() => {
                  setPlaying((p) => !p)
                }}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface-container ${focus}`}
              >
                {playing ? <Pause aria-hidden="true" className="h-5 w-5" /> : <Play aria-hidden="true" className="h-5 w-5" />}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
