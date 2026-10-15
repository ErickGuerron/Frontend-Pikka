import { Link } from 'react-router'
import { TRACKING_STEPS } from './data'

/** Explicación del proceso de entrega. No muestra datos en vivo: el seguimiento real vive en la cuenta. */
export function Tracking() {
  return (
    <section id="rastreo" aria-labelledby="rastreo-titulo" className="scroll-mt-20 bg-surface-container-low px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <h2 id="rastreo-titulo" className="text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
          Así llega tu pedido
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-6 text-on-surface-variant">
          Cada entrega pasa por tres pasos. Con tu cuenta puedes consultar el estado y la ruta de tu pedido.
        </p>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {TRACKING_STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
              <span aria-hidden="true" className="text-sm font-bold text-secondary">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-on-surface-variant">{step.text}</p>
            </li>
          ))}
        </ol>
        <Link
          to="/login"
          className="mt-10 inline-block rounded-xl bg-primary px-6 py-3 text-center font-semibold text-white shadow-sm transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
        >
          Entra a tu cuenta para seguir tu pedido
        </Link>
      </div>
    </section>
  )
}
