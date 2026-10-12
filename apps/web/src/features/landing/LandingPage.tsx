import { BenefitsTelemetry } from './BenefitsTelemetry'
import { Faq } from './Faq'
import { FinalCta } from './FinalCta'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { LandingFooter } from './LandingFooter'
import { LandingHeader } from './LandingHeader'
import { Testimonials } from './Testimonials'
import { Zones } from './Zones'
import './landing.css'

/** Public landing page. Independent of auth: no API calls, no session reads. */
export function LandingPage() {
  return (
    <div className="landing min-h-screen">
      <LandingHeader />
      <main>
        <Hero />
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
