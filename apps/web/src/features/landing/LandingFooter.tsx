import { Link } from 'react-router'
import { Brand } from './Brand'

const link =
  'rounded text-sm text-on-surface-variant hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2'

/** Pie: solo enlaces que existen. Sin tiendas, sin páginas inexistentes y sin datos de seguridad no verificados. */
export function LandingFooter() {
  return (
    <footer className="border-t border-outline-variant/50 bg-surface-container px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <Brand />
        <nav aria-label="Pie de página">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <a href="#catalogo" className={link}>
                Catálogo
              </a>
            </li>
            <li>
              <a href="#rastreo" className={link}>
                Rastrear pedido
              </a>
            </li>
            <li>
              <Link to="/login" className={link}>
                Iniciar sesión
              </Link>
            </li>
            <li>
              <Link to="/login?modo=registro" className={link}>
                Crear cuenta
              </Link>
            </li>
          </ul>
        </nav>
        <p className="text-sm text-on-surface-variant">{`© ${String(new Date().getFullYear())} Pikka`}</p>
      </div>
    </footer>
  )
}
