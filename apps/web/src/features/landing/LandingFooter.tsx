import { Link } from 'react-router'
import { Brand } from './Brand'

const LINKS = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#zonas', label: 'Zonas de Entrega' },
  { href: '#preguntas', label: 'Preguntas' },
]

const link =
  'rounded text-sm text-on-surface-variant hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary'

export function LandingFooter() {
  return (
    <footer className="border-t border-outline-variant/50 bg-surface-container px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <Brand />
        <nav aria-label="Pie de página">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className={link}>{l.label}</a>
              </li>
            ))}
            <li>
              <Link to="/login" className={link}>Iniciar sesión</Link>
            </li>
          </ul>
        </nav>
        <p className="text-sm text-on-surface-variant">© {new Date().getFullYear()} Pikka. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
