import { Features } from "./components/Features"
import { FinalCta } from "./components/FinalCta"
import { Hero } from "./components/Hero"
import { HowItWorks } from "./components/HowItWorks"
import { OpenSource } from "./components/OpenSource"
import { SelfHost } from "./components/SelfHost"
import { SiteFooter } from "./components/SiteFooter"
import { SiteNav } from "./components/SiteNav"
import { TrustStrip } from "./components/TrustStrip"
import { useTheme } from "./hooks/useTheme"

// The marketing landing page: a single column of sections, with a light/dark toggle owned here.
export const LandingPage = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background font-sans text-body">
      <SiteNav theme={theme} onToggleTheme={toggleTheme} />
      <Hero />
      <TrustStrip />
      <Features />
      <HowItWorks />
      <SelfHost />
      <OpenSource />
      <FinalCta />
      <SiteFooter />
    </div>
  )
}
