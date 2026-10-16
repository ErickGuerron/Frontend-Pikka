import type { ReactNode } from 'react'

interface CollectionItem {
  id: string
  code: string
  title: string
  text: string
  linkText: string
  icon: (props: { className?: string }) => ReactNode
}

const COLLECTIONS: CollectionItem[] = [
  {
    id: 'pasteleria',
    code: 'COLECCIÓN 01',
    title: 'Pastelería de Autor',
    text: 'Transporte zero-tilt nivelado en contenedor isotérmico sellado para repostería delicada.',
    linkText: 'Ver selección',
    icon: ({ className = 'h-6 w-6' }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M5 21h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: 'regalos',
    code: 'COLECCIÓN 02',
    title: 'Regalos en 30 Minutos',
    text: 'Cajas sorpresa de alta gama, tarjeta caligrafiada a mano y sellado hermético.',
    linkText: 'Ver detalles',
    icon: ({ className = 'h-6 w-6' }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 8v13m0-13V4a2 2 0 112 2h-2zm0 0V4a2 2 0 10-2 2h2zm0 0H4a2 2 0 00-2 2v2a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8zm-8 4h16v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: 'audio',
    code: 'COLECCIÓN 03',
    title: 'Audio & Accesorios',
    text: 'Sellos de seguridad de fábrica, garantía oficial vigente y entrega con código PIN.',
    linkText: 'Ver catálogo',
    icon: ({ className = 'h-6 w-6' }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
]

export function Collections() {
  return (
    <section aria-labelledby="colecciones-titulo" className="bg-[var(--landing-bg)] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 id="colecciones-titulo" className="sr-only">
          Colecciones Destacadas
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {COLLECTIONS.map((c) => {
            const Icon = c.icon
            return (
              <div
                key={c.code}
                className="group flex items-start justify-between rounded border border-[var(--landing-line)] bg-white p-5 shadow-sm transition-[border-color,box-shadow] hover:border-[var(--landing-deep)] sm:p-6"
              >
                <div className="max-w-[70%] space-y-2">
                  <span className="inline-block rounded border border-[var(--landing-line)] bg-[var(--landing-tag-bg)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--landing-deep)]">
                    {c.code}
                  </span>
                  <h3 className="text-base font-semibold tracking-tight text-[var(--landing-deep)]">{c.title}</h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-[var(--landing-muted)]">{c.text}</p>
                  <a
                    href="#catalogo"
                    className="inline-flex items-center gap-1 pt-1 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--landing-deep)] transition-colors hover:text-[var(--landing-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)]"
                  >
                    <span>{c.linkText}</span>
                    <span>→</span>
                  </a>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-[var(--landing-line)] bg-[var(--landing-tag-bg)] text-[var(--landing-deep)]">
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
