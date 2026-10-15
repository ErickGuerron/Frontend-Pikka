import { useState, type SyntheticEvent } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router'
import { Brand } from './Brand'

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2'

interface LandingHeaderProps {
  /** Recibe el texto buscado al enviar; el catálogo lo usa para filtrar por nombre. */
  onSearch: (query: string) => void
}

export function LandingHeader({ onSearch }: LandingHeaderProps) {
  const [value, setValue] = useState('')

  const submit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSearch(value.trim())
    window.location.hash = 'catalogo'
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-outline-variant/40 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <a href="#inicio" aria-label="pikka, ir al inicio" className={`shrink-0 rounded-lg ${focus}`}>
          <Brand />
        </a>

        <form role="search" onSubmit={submit} className="flex min-w-0 flex-1 justify-center">
          <div className="relative w-full max-w-md">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              aria-label="Buscar productos"
              placeholder="Buscar productos…"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
              }}
              className={`h-10 w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-9 pr-3 text-sm transition-colors placeholder:text-on-surface-variant ${focus}`}
            />
          </div>
        </form>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="#rastreo"
            className={`hidden rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-surface-container sm:inline-block ${focus}`}
          >
            Rastrear
          </a>
          <Link
            to="/login"
            className={`rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-container ${focus}`}
          >
            Mi cuenta
          </Link>
        </div>
      </div>
    </header>
  )
}
