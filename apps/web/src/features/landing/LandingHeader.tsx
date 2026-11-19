import { useState, type SyntheticEvent } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router'
import { Brand } from './Brand'

interface LandingHeaderProps {
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
    <header className="sticky top-0 z-50 border-b border-[var(--landing-line)] bg-[var(--landing-bg)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex shrink-0 items-center">
          <a href="#inicio" aria-label="Pikka, volver al inicio" className="group flex items-center">
            <Brand />
          </a>
        </div>

        {/* Search bar in editorial style */}
        <form role="search" onSubmit={submit} className="flex min-w-0 flex-1 justify-center max-w-sm sm:max-w-md mx-2">
          <div className="relative w-full">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--landing-muted)]" />
            <input
              type="search"
              aria-label="Buscar productos"
              placeholder="Buscar productos…"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
              }}
              className="h-8.5 w-full rounded border border-[var(--landing-line)] bg-white pl-8 pr-3 font-mono text-xs text-[var(--landing-text)] placeholder:text-[var(--landing-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)]"
            />
          </div>
        </form>

        {/* Right CTA links */}
        <div className="flex shrink-0 items-center gap-2">
          <a
            href="#rastreo"
            className="hidden items-center gap-1.5 rounded border border-[var(--landing-line)] bg-white px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--landing-deep)] transition-colors hover:border-[var(--landing-deep)] lg:flex"
          >
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[var(--landing-accent)]" />
            <span>Rastrear</span>
          </a>
          <Link
            to="/login"
            className="flex items-center gap-2 rounded border border-[var(--landing-deep)] bg-primary px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider text-white transition-colors hover:bg-primary-container"
          >
            <span>Mi cuenta</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
