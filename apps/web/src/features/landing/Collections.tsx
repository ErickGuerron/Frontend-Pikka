import { Cookie, Flower2, Gift } from 'lucide-react'

const COLLECTIONS = [
  {
    code: 'COLECCIÓN 01',
    title: 'Ramos y arreglos',
    text: 'Flores frescas para regalar o decorar.',
    icon: Flower2,
  },
  {
    code: 'COLECCIÓN 02',
    title: 'Cajas de regalo',
    text: 'Combinaciones listas para dar con empaque curado.',
    icon: Gift,
  },
  {
    code: 'COLECCIÓN 03',
    title: 'Chocolates y galletas',
    text: 'Dulces finos para compartir o disfrutar en el momento.',
    icon: Cookie,
  },
]

export function Collections() {
  return (
    <section aria-labelledby="colecciones-titulo" className="bg-[var(--landing-bg)] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 id="colecciones-titulo" className="sr-only">
          Colecciones
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {COLLECTIONS.map((c) => {
            const Icon = c.icon
            return (
              <a
                key={c.code}
                href="#catalogo"
                className="group flex items-start justify-between rounded border border-[var(--landing-line)] bg-white p-5 shadow-sm transition-[border-color,box-shadow] hover:border-[var(--landing-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] sm:p-6"
              >
                <div className="max-w-[70%] space-y-2">
                  <span className="inline-block rounded border border-[var(--landing-line)] bg-[var(--landing-tag-bg)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--landing-deep)]">
                    {c.code}
                  </span>
                  <h3 className="text-base font-semibold tracking-tight text-[var(--landing-deep)]">{c.title}</h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-[var(--landing-muted)]">{c.text}</p>
                  <span className="inline-flex items-center gap-1 pt-1 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--landing-deep)] transition-colors group-hover:text-[var(--landing-accent)]">
                    <span>Ver productos</span>
                    <span>→</span>
                  </span>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-[var(--landing-line)] bg-[var(--landing-tag-bg)] text-[var(--landing-deep)]">
                  <Icon className="h-6 w-6" />
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
