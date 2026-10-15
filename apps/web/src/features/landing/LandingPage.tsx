import { BenefitsTelemetry } from './BenefitsTelemetry'
import { Carousel } from './Carousel'
import { Faq } from './Faq'
import { FinalCta } from './FinalCta'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { LandingFooter } from './LandingFooter'
import { LandingHeader } from './LandingHeader'
import { ProductCarousel } from './ProductCarousel'
import { QuickSearch } from './QuickSearch'
import { Testimonials } from './Testimonials'
import { Zones } from './Zones'
import './landing.css'

/**
 * Landing pública. No depende de la sesión: el único dato remoto es el catálogo
 * público, que se pide sin token.
 */
export function LandingPage() {
  return (
    <div className="landing min-h-screen">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      >
        Saltar al contenido
      </a>
      <LandingHeader />
      <main id="contenido" tabIndex={-1}>
        <Hero />
        <QuickSearch />
        <Carousel />
        <ProductCarousel />
        <HowItWorks />
        <BenefitsTelemetry />
        <Testimonials />
        <FinalCta />
        <Zones />
        <Faq />
      </main>
      <LandingFooter />
    </div>
  )
}
