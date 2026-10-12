import { Quote } from 'lucide-react'
import { TESTIMONIALS } from './data'

export function Testimonials() {
  return (
    <section aria-labelledby="opiniones-titulo" className="bg-surface-container-low px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full bg-secondary-fixed px-3 py-1 text-xs font-bold tracking-wide text-on-secondary-container">
            EJEMPLOS ILUSTRATIVOS
          </p>
          <h2 id="opiniones-titulo" className="mt-4 text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
            Así se vive una entrega con Pikka
          </h2>
          <p className="mt-3 text-base leading-6 text-on-surface-variant">
            Ejemplos ilustrativos de la experiencia, no son opiniones de clientes reales.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.id} className="flex flex-col rounded-2xl bg-surface-container-lowest p-6 shadow-md">
              <Quote aria-hidden="true" className="h-8 w-8 text-secondary" />
              <blockquote className="mt-3 flex-1 text-base leading-6">{t.quote}</blockquote>
              <figcaption className="mt-5 border-t border-outline-variant/50 pt-4">
                <strong className="block">Cliente</strong>
                <span className="text-sm text-on-surface-variant">Ejemplo ilustrativo</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
