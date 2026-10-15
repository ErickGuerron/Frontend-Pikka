import { COMMITMENTS } from './data'

/** Tres compromisos del servicio. Claims a validar por el negocio: ver el cuerpo del commit. */
export function Commitments() {
  return (
    <section aria-labelledby="compromiso-titulo" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <h2 id="compromiso-titulo" className="text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
          Nuestro compromiso
        </h2>
        <ul className="mt-10 grid gap-8 md:grid-cols-3">
          {COMMITMENTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="h-fit shrink-0 rounded-xl bg-primary-fixed p-3 text-primary">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-1 text-on-surface-variant">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
