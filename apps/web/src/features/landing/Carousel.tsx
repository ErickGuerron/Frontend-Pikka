import pikkaMascot from '@/assets/pikka.png'
import { SLIDES } from './data'
import { ScrollCarousel } from './ScrollCarousel'

const TITLE_ID = 'servicios-titulo'

/** Servicios: carrusel con autoplay opcional. */
export function Carousel() {
  return (
    <section id="servicios" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full bg-secondary-fixed px-3 py-1 text-xs font-bold tracking-wide text-on-secondary-container">
            NUESTROS SERVICIOS
          </p>
          <h2 id={TITLE_ID} className="mt-4 text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
            ¿Qué puedes hacer con Pikka?
          </h2>
          <p className="mt-3 text-base leading-6 text-on-surface-variant">
            Pikka es un servicio de entregas: creas tu pedido, eliges tu ventana y lo sigues hasta tu puerta.
          </p>
        </div>

        <div className="mt-10">
          <ScrollCarousel
            labelledBy={TITLE_ID}
            autoplay
            labels={{ previous: 'Anterior', next: 'Siguiente', goTo: (n) => `Ir a la diapositiva ${String(n)}` }}
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
                  <div className="relative flex h-40 items-center justify-center bg-surface-container">
                    <span className="rounded-xl bg-primary-fixed p-4 text-primary">
                      <Icon aria-hidden="true" className="h-10 w-10" />
                    </span>
                    {slide.mascot ? (
                      <img
                        src={pikkaMascot}
                        alt=""
                        aria-hidden="true"
                        width={1536}
                        height={1024}
                        loading="lazy"
                        decoding="async"
                        className="absolute bottom-0 right-3 h-24 w-24 object-contain"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="break-words text-xl font-bold">{slide.title}</h3>
                    <p className="mt-2 text-base leading-6 text-on-surface-variant">{slide.text}</p>
                    {slide.chips ? (
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {slide.chips.map((chip) => (
                          <li key={chip} className="rounded-full bg-primary-fixed px-3 py-1 text-sm font-semibold tabular-nums text-primary">
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
          </ScrollCarousel>
        </div>
      </div>
    </section>
  )
}
