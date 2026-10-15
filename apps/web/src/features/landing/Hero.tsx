const cta = 'rounded-xl px-6 py-3 text-center font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2'

export function Hero() {
  return (
    <section id="inicio" className="relative scroll-mt-20 overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold tracking-wide text-secondary">Entregas a domicilio</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
            Lo mejor de la ciudad, en tu puerta: regalos, flores, chocolates y galletas.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-6 text-on-surface-variant">
            Explora el catálogo, elige tu detalle y haz tu pedido con tu cuenta.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#catalogo" className={`${cta} bg-primary text-white hover:bg-primary-container`}>
              Explorar catálogo
            </a>
            <a
              href="#rastreo"
              className={`${cta} border border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface-container`}
            >
              Cómo funciona
            </a>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="mx-auto flex aspect-square w-full max-w-md flex-col justify-between overflow-hidden rounded-3xl bg-primary p-8 text-white shadow-xl"
        >
          <span className="text-6xl font-bold tracking-tight sm:text-7xl">pikka</span>
          <ul className="space-y-1 text-2xl font-semibold tracking-tight">
            <li>Regalos.</li>
            <li>Flores.</li>
            <li>Chocolates.</li>
            <li>Galletas.</li>
          </ul>
          <span className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-[var(--landing-accent)]" />
            <span className="h-1.5 w-24 rounded-full bg-[var(--landing-accent)]" />
          </span>
        </div>
      </div>
    </section>
  )
}
