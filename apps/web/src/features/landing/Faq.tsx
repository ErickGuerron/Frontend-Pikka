import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { FAQS } from './data'

export function Faq() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section id="preguntas" aria-labelledby="preguntas-titulo" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="inline-block rounded-full bg-secondary-fixed px-3 py-1 text-xs font-bold tracking-wide text-on-secondary-container">
            AYUDA
          </p>
          <h2 id="preguntas-titulo" className="mt-4 text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
            Preguntas frecuentes
          </h2>
        </div>
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
                <h3>
                  <button
                    type="button"
                    id={`faq-btn-${String(i)}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${String(i)}`}
                    onClick={() => {
                      setOpen(isOpen ? null : i)
                    }}
                    className="flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  >
                    {f.q}
                    <ChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 motion-reduce:transition-none transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </h3>
                <div id={`faq-panel-${String(i)}`} role="region" aria-labelledby={`faq-btn-${String(i)}`} hidden={!isOpen} className="px-5 pb-4 text-base leading-6 text-on-surface-variant">
                  {f.a}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
