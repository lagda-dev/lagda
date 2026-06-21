import { Button, Logo } from "@lagda/ui"
import { APP_LOGIN_URL, APP_SIGNUP_URL } from "../constants"
import { NAV_LINKS } from "../content"
import type { Theme } from "../hooks/useTheme"

interface SiteNavProps {
  theme: Theme
  onToggleTheme: () => void
}

// Sticky, blurred top bar: brand lockup, section anchors, theme toggle, and the primary auth CTAs.
export const SiteNav = ({ theme, onToggleTheme }: SiteNavProps) => (
  <header className="sticky top-0 z-50 flex h-[60px] items-center gap-[18px] border-b border-border bg-background/80 px-7 backdrop-blur-md">
    <Logo size={25} />
    <nav className="ml-3.5 hidden gap-1 md:flex">
      {NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="rounded-md px-2.5 py-[7px] text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
        >
          {link.label}
        </a>
      ))}
    </nav>
    <div className="ml-auto flex items-center gap-2.5">
      <button
        type="button"
        onClick={onToggleTheme}
        className="flex h-8 items-center gap-[7px] rounded-md border border-border bg-card px-2.5 text-[12.5px] font-medium text-body transition-colors hover:bg-hover"
      >
        <span className="h-[7px] w-[7px] rounded-full bg-foreground" />
        {theme === "dark" ? "Light" : "Dark"}
      </button>
      <a href={APP_LOGIN_URL} className="hidden text-[13.5px] font-medium text-body hover:text-foreground sm:inline">
        Sign in
      </a>
      <Button asChild size="sm" className="h-[34px] px-[15px] text-[13px]">
        <a href={APP_SIGNUP_URL}>Get started</a>
      </Button>
    </div>
  </header>
)
