import { useState } from 'react'
import { Collections } from './Collections'
import { Commitments } from './Commitments'
import { Hero } from './Hero'
import { LandingFooter } from './LandingFooter'
import { LandingHeader } from './LandingHeader'
import { ProductCarousel } from './ProductCarousel'
import { Tracking } from './Tracking'
import './landing.css'

/**
 * Landing pública. No depende de la sesión: el único dato remoto es el catálogo
 * público, que se pide sin token.
 */
export function LandingPage() {
  const [query, setQuery] = useState('')

  return (
    <div className="landing min-h-screen">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      >
        Saltar al contenido
      </a>
      <LandingHeader onSearch={setQuery} />
      <main id="contenido" tabIndex={-1}>
        <Hero />
        <Collections />
        <ProductCarousel
          query={query}
          onClearQuery={() => {
            setQuery('')
          }}
        />
        <Tracking />
        <Commitments />
      </main>
      <LandingFooter />
    </div>
  )
}
