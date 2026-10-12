import { useState } from 'react'
import { Link } from 'react-router'
import { CalendarClock, CircleCheck, Clock, MapPin, Route, Undo2 } from 'lucide-react'
import { DELIVERY_WINDOWS } from './data'

const HIGHLIGHTS = [
  { icon: CircleCheck, label: 'Validamos tu zona y capacidad' },
  { icon: Route, label: 'Seguimiento en el mapa' },
  { icon: Undo2, label: 'Cancela antes de la recogida' },
]

const field =
  'w-full rounded-xl border border-outline-variant bg-surface px-10 py-3 text-base text-on-surface placeholder:text-on-surface-variant/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary'

/** Order starter: collects nothing yet, it only leads the visitor to sign up. */
export function QuickSearch() {
  const [address, setAddress] = useState('')
  const [deliveryWindow, setDeliveryWindow] = useState('')
  return (
    <section aria-labelledby="buscador-titulo" className="relative z-10 -mt-10 px-4 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 rounded-2xl bg-surface-container-lowest p-5 shadow-xl sm:p-8 lg:grid-cols-[1fr_16rem]">
        <div>
          <h2 id="buscador-titulo" className="text-2xl font-bold tracking-tight">
            Solicita tu entrega
          </h2>
          <p className="mt-1 text-base leading-6 text-on-surface-variant">
            Solicita tu entrega, elige tu ventana y sigue tu pedido en tiempo real.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <label htmlFor="qs-direccion" className="mb-1 block text-sm font-semibold">
                Tu dirección de entrega
              </label>
              <div className="relative">
                <MapPin aria-hidden="true" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                <input
                  id="qs-direccion"
                  className={field}
                  placeholder="Calle, número y colonia..."
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value)
                  }}
                />
              </div>
            </div>
            <div>
              <label htmlFor="qs-ventana" className="mb-1 block text-sm font-semibold">
                Ventana de entrega
              </label>
              <div className="relative">
                <CalendarClock aria-hidden="true" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                <select
                  id="qs-ventana"
                  className={field}
                  value={deliveryWindow}
                  onChange={(e) => {
                    setDeliveryWindow(e.target.value)
                  }}
                >
                  <option value="">Elige una ventana</option>
                  {DELIVERY_WINDOWS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Link
              to="/login?modo=registro"
              className="rounded-xl bg-primary px-6 py-3 text-center font-semibold text-white hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
            >
              Crear pedido
            </Link>
          </div>
          <ul className="mt-5 flex flex-wrap gap-2">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-primary">
                <Icon aria-hidden="true" className="h-4 w-4" />
                {label}
              </li>
            ))}
          </ul>
        </div>
        <aside className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container p-5 text-center text-white">
          <Clock aria-hidden="true" className="h-7 w-7 text-primary-fixed" />
          <p className="mt-2 text-sm">Ventanas de entrega</p>
          <p className="text-3xl font-bold">09–21 h</p>
          <p className="mt-1 text-sm text-primary-fixed">4 franjas al día</p>
        </aside>
      </div>
    </section>
  )
}
