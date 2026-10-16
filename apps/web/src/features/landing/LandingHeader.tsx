import { Link } from 'react-router'
import { Brand } from './Brand'

interface LandingHeaderProps {
  onSearch?: (query: string) => void
  selectedCategory?: string
  onSelectCategory?: (category: string) => void
}

export function LandingHeader(_props: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--landing-line)] bg-[var(--landing-bg)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex shrink-0 items-center">
          <a href="#inicio" aria-label="Pikka, volver al inicio" className="group flex items-center">
            <Brand />
          </a>
        </div>

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
            className="flex items-center gap-2 rounded border border-[var(--landing-deep)] bg-[var(--landing-deep)] px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider text-white transition-colors hover:bg-[var(--landing-primary-hover)]"
          >
            <span>Mi Cuenta</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
