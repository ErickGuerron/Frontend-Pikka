import { Link } from 'react-router'

const btn =
  'rounded-xl px-6 py-3 text-center font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary'

export function FinalCta() {
  return (
    <section aria-labelledby="cta-titulo" className="px-4 py-20 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary-container to-secondary p-8 text-center text-on-primary shadow-xl sm:p-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-secondary-fixed/30 blur-3xl" />
        <p className="relative inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide">
          ENTREGA DIRECTA A TU HOGAR
        </p>
        <h2 id="cta-titulo" className="relative mt-4 text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
          ¿Listo para pedir tu primera entrega?
        </h2>
        <p className="relative mx-auto mt-3 max-w-2xl text-base leading-6 text-primary-fixed">
          Crea tu cuenta, solicita tu entrega, elige tu ventana y sigue tu pedido hasta tu puerta.
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/login?modo=registro" className={`${btn} bg-white text-primary hover:bg-primary-fixed`}>
            Crear cuenta
          </Link>
          <Link to="/login" className={`${btn} border border-white/60 text-white hover:bg-white/10`}>
            Iniciar sesión
          </Link>
        </div>
      </div>
    </section>
  )
}
