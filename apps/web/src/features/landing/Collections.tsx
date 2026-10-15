import { COLLECTIONS } from './data'

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2'

/** Tres colecciones que llevan al catálogo. Sin precios ni cifras. */
export function Collections() {
  return (
    <section aria-labelledby="colecciones-titulo" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <h2 id="colecciones-titulo" className="text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
          Colecciones
        </h2>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {COLLECTIONS.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <a
                href="#catalogo"
                className={`group flex h-full flex-col rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-sm transition-[border-color,box-shadow] hover:border-secondary hover:shadow-md ${focus}`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-2 text-on-surface-variant">{text}</p>
                <span className="mt-auto pt-6 text-sm font-semibold text-primary group-hover:underline">Ver productos</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
