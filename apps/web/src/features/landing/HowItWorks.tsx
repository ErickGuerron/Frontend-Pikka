import { STEPS } from './data'

export function HowItWorks() {
  return (
    <section aria-labelledby="como-funciona-titulo" className="bg-surface-container-low px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full bg-secondary-fixed px-3 py-1 text-xs font-bold tracking-wide text-on-secondary-container">
            OPERACIÓN FLUÍDA
          </p>
          <h2 id="como-funciona-titulo" className="mt-4 text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
            ¿Cómo funciona Pikka?
          </h2>
          <p className="mt-3 text-base leading-6 text-on-surface-variant">
            Tecnología de ruteo dinámico inspirada en la velocidad hidrodinámica de nuestra nutria: ágil, precisa y
            siempre a tiempo.
          </p>
        </div>
        <ol className="relative mt-14 grid gap-10 md:grid-cols-3">
          <div
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-8 hidden h-0.5 bg-gradient-to-r from-secondary via-primary-container to-primary md:block"
          />
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative text-center">
              <span
                aria-hidden="true"
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white shadow-lg ring-8 ring-surface-container-low"
              >
                {i + 1}
              </span>
              <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-base leading-6 text-on-surface-variant">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
