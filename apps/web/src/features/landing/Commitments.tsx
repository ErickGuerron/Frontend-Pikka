import type { ReactNode } from 'react'

interface Pillar {
  title: string
  text: string
  feature: string
  icon: (props: { className?: string }) => ReactNode
}

const PILLARS: Pillar[] = [
  {
    title: 'Empaque isotérmico certificado',
    text: 'Contenedores sellados al vacío y aislantes térmicos pasivos que conservan la frescura de postres, flores y dermocosmética durante todo el trayecto.',
    feature: 'Sensores de inclinación y apertura activa',
    icon: ({ className = 'h-5 w-5' }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    title: 'Telemetría satelital en vivo',
    text: 'Ubicación precisa en tiempo real vía GPS de alta tasa de refresco. Sin ventanas de entrega ambiguas ni demoras no informadas.',
    feature: 'Notificaciones automáticas directas',
    icon: ({ className = 'h-5 w-5' }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
        <path d="M12 7v5l3 3" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: 'Garantía de reposición inmediata',
    text: 'Si tu producto sufre una alteración o si tardamos más del tiempo pactado, realizamos reembolso directo o envío inmediato de reposición sin costo.',
    feature: 'Soporte por operador humano < 30 seg',
    icon: ({ className = 'h-5 w-5' }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
]

export function Commitments() {
  return (
    <section aria-labelledby="compromiso-titulo" className="border-t border-[var(--landing-line)] bg-[var(--landing-bg)] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="inline-block rounded border border-[var(--landing-line)] bg-white px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--landing-deep)]">
            COMPROMISO OPERATIVO PIKKA
          </span>
          <h2 id="compromiso-titulo" className="mt-2 text-2xl font-semibold tracking-tight text-[var(--landing-deep)] sm:text-3xl">
            Calidad y calibración sin excepciones
          </h2>
          <p className="mt-2 font-mono text-xs text-[var(--landing-muted)]">
            Diseñamos cada eslabón logístico para que los artículos más delicados lleguen en las mismas condiciones que salieron de tienda.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon
            return (
              <div
                key={pillar.title}
                className="space-y-3 rounded border border-[var(--landing-line)] bg-white p-6 shadow-sm transition-[border-color,box-shadow] hover:border-[var(--landing-deep)] sm:p-8"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded border border-[var(--landing-line)] bg-[var(--landing-tag-bg)] text-[var(--landing-deep)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold tracking-tight text-[var(--landing-deep)]">{pillar.title}</h3>
                <p className="text-xs leading-relaxed text-[var(--landing-muted)]">{pillar.text}</p>
                <div className="flex items-center gap-1.5 border-t border-[var(--landing-line)] pt-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--landing-deep)]">
                  <span className="text-[var(--landing-accent)]">✓</span>
                  <span>{pillar.feature}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
