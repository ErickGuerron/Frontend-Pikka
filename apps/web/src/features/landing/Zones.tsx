import { MapPinned } from 'lucide-react'
import { ZONES } from './data'

export function Zones() {
  return (
    <section id="zonas" aria-labelledby="zonas-titulo" className="scroll-mt-20 bg-surface-container-low px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full bg-secondary-fixed px-3 py-1 text-xs font-bold tracking-wide text-on-secondary-container">
            COBERTURA
          </p>
          <h2 id="zonas-titulo" className="mt-4 text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
            Zonas de entrega
          </h2>
          <p className="mt-3 text-base leading-6 text-on-surface-variant">
            Llegamos a distintas zonas de la ciudad. Al ingresar tu dirección al hacer un pedido, confirmamos si tu
            ubicación tiene cobertura.
          </p>
        </div>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {ZONES.map((z) => (
            <li key={z.title} className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
              <span className="inline-flex rounded-xl bg-primary-fixed p-3 text-primary">
                <MapPinned aria-hidden="true" className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-xl font-bold">{z.title}</h3>
              <p className="mt-2 text-base leading-6 text-on-surface-variant">{z.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
