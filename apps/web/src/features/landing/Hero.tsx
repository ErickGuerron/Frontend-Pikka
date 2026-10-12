import { Truck } from 'lucide-react'
import { Mascot } from './Mascot'

const STATS = [
  { value: '4', label: 'Ventanas de entrega al día' },
  { value: 'Mapa', label: 'Seguimiento de tu ruta' },
  { value: 'Antes', label: 'Cancela hasta la recogida' },
]

const cta =
  'rounded-xl px-6 py-3 text-center font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2'

export function Hero() {
  return (
    <section id="inicio" className="relative scroll-mt-20 overflow-hidden px-4 pb-24 pt-28 sm:px-6 lg:pt-32">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-secondary-fixed/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-primary-fixed/60 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="inline-flex flex-wrap items-center gap-2 rounded-full bg-secondary-fixed px-3 py-1 text-xs font-bold tracking-wide text-on-secondary-container">
            <span>SERVICIO DE ENTREGAS</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold">Directo a tu puerta</span>
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
            Pide tu entrega y{' '}
            <span className="bg-gradient-to-r from-secondary to-primary-container bg-clip-text text-transparent">
              elige tu ventana
            </span>{' '}
            de horario.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-6 text-on-surface-variant">
            Solicita tu entrega, elige tu ventana y sigue tu pedido en tiempo real.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#servicios" className={`${cta} bg-primary text-white shadow-md hover:bg-primary-container`}>
              Ver qué ofrece Pikka
            </a>
            <a href="#rastreo" className={`${cta} border border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface-container`}>
              Rastrear mi Pedido
            </a>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <dd className="text-xl font-bold text-primary sm:text-2xl">{s.value}</dd>
                <dt className="text-xs text-on-surface-variant sm:text-sm">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-fixed to-surface-container" />
          <Mascot className="absolute inset-[6%] h-[88%] w-[88%] object-contain drop-shadow-xl" />
          <div className="landing-float absolute left-0 top-6 flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-3 shadow-lg sm:-left-6">
            <span className="rounded-xl bg-secondary-fixed p-2 text-secondary">
              <Truck aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="text-sm">
              <strong className="block">Pedido en Camino</strong>
              <span className="text-on-surface-variant">Sigue la ruta en el mapa</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
