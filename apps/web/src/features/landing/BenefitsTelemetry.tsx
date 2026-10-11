import { BENEFITS } from './data'

const STATS = [
  { value: 'En ruta', label: 'Estado' },
  { value: '12–15', label: 'Ventana' },
  { value: '2 de 5', label: 'Parada' },
]

function TelemetryCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-primary p-5 text-on-primary shadow-xl sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-bold">Seguimiento de ruta Pikka</h3>
        <span className="rounded-full bg-tertiary-fixed px-3 py-1 text-xs font-bold text-on-tertiary-fixed-variant">
          DEMO ILUSTRATIVA
        </span>
      </div>
      <p className="mt-1 text-sm text-primary-fixed">Ruta simulada con fines ilustrativos, no es un pedido real.</p>
      <svg
        role="img"
        aria-label="Mapa ilustrativo de una ruta simulada entre el Hub Central y el destino final"
        viewBox="0 0 400 220"
        className="mt-4 h-auto w-full rounded-xl bg-primary-container"
      >
        <path
          d="M50 170 C 120 170, 120 70, 200 90 S 300 60, 350 50"
          fill="none"
          stroke="#6bf9e4"
          strokeWidth="4"
          strokeDasharray="8 8"
          strokeLinecap="round"
          className="landing-route"
        />
        <circle cx="50" cy="170" r="10" fill="#a5eff2" />
        <circle cx="200" cy="90" r="9" fill="#ffdcc3" />
        <circle cx="350" cy="50" r="10" fill="#6bf9e4" />
        <g fontSize="12" fill="#ffffff" fontWeight="600">
          <text x="38" y="198">A · Hub Central</text>
          <text x="150" y="124">Conductor Nutria #14</text>
          <text x="262" y="34">B · Destino Final</text>
        </g>
      </svg>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl bg-primary-container p-3">
            <dd className="font-mono text-lg font-medium">{s.value}</dd>
            <dt className="text-xs text-primary-fixed">{s.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function BenefitsTelemetry() {
  return (
    <section id="rastreo" aria-labelledby="compromiso-titulo" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <TelemetryCard />
        <div>
          <p className="inline-block rounded-full bg-secondary-fixed px-3 py-1 text-xs font-bold tracking-wide text-on-secondary-container">
            COMPROMISO PIKKA
          </p>
          <h2 id="compromiso-titulo" className="mt-4 text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
            Un servicio de entregas claro de principio a fin
          </h2>
          <p className="mt-3 text-base leading-6 text-on-surface-variant">
            Crea tu pedido, sigue su avance y consulta su ruta hasta que llega a tu puerta.
          </p>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="h-fit rounded-xl bg-primary-fixed p-2 text-primary">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span>
                  <strong className="block">{title}</strong>
                  <span className="text-sm text-on-surface-variant">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
