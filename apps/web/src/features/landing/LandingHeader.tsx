import { Link } from 'react-router'
import { Brand } from './Brand'

const NAV = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#zonas', label: 'Zonas de Entrega' },
  { href: '#preguntas', label: 'Preguntas' },
]

const focus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2'

export function LandingHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-outline-variant/40 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <a href="#inicio" className={`rounded-lg ${focus}`} aria-label="Pikka, ir al inicio">
          <Brand />
        </a>
        <nav aria-label="Principal" className="hidden items-center gap-6 xl:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`rounded text-sm font-semibold text-on-surface-variant hover:text-primary ${focus}`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="#rastreo"
            className={`hidden rounded-lg border border-secondary px-4 py-2 text-sm font-semibold text-secondary hover:bg-secondary-fixed/40 md:inline-block ${focus}`}
          >
            Rastrear Pedido
          </a>
          <Link
            to="/login?modo=registro"
            className={`hidden rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-surface-container sm:inline-block ${focus}`}
          >
            Crear cuenta
          </Link>
          <Link
            to="/login"
            className={`rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-container ${focus}`}
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </header>
  )
}
