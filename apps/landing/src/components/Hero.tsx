import { Button } from "@lagda/ui"
import { APP_SIGNUP_URL, GITHUB_REPO_URL } from "../constants"
import { ProductMock } from "./ProductMock"

// The opening pitch: dotted-grid backdrop, status badge, headline, CTAs, and a clone-command pill,
// followed by the dashboard mock.
export const Hero = () => (
  <section className="relative overflow-hidden bg-[radial-gradient(circle_at_center,hsl(var(--border))_1px,transparent_1px)] bg-[length:26px_26px] px-7 pb-[72px] pt-24">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_25%,transparent,hsl(var(--background))_78%)]" />
    <div className="relative mx-auto max-w-[820px] text-center">
      <div className="mb-[26px] inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-[5px] shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        <span className="font-mono text-[11.5px] text-body">v0.1.0-beta · open-source · AGPL-3.0</span>
      </div>
      <h1 className="m-0 text-[60px] font-semibold leading-[1.02] tracking-[-0.035em] text-foreground">
        Email signatures,
        <br />
        managed like infrastructure.
      </h1>
      <p className="mx-auto mt-6 max-w-[600px] text-[18px] leading-[1.6] text-muted-foreground">
        Open-source, self-hostable signature management. Sync your directory, design once, and deploy a consistent signature to every mailbox — running entirely
        on your own servers.
      </p>
      <div className="mt-[34px] flex justify-center gap-3">
        <Button asChild size="lg" className="h-11 px-[22px] text-sm font-semibold">
          <a href={APP_SIGNUP_URL}>Get started — it's free</a>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11 border-border-strong px-[18px] text-sm">
          <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
            <span className="font-mono text-[13px]">★</span>
            Star on GitHub
          </a>
        </Button>
      </div>
      <div className="mt-[26px] inline-flex items-center gap-2.5 rounded-md border border-border bg-card px-4 py-2.5 font-mono text-[13px] shadow-sm">
        <span className="text-faint">$</span>
        <span className="text-body">git clone lagda-dev/lagda &amp;&amp; docker compose up</span>
        <span className="inline-block h-3.5 w-[7px] animate-pulse-dot bg-foreground" />
      </div>
    </div>

    <ProductMock />
  </section>
)
