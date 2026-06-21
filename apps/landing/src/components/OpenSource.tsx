import { Button, Logomark } from "@lagda/ui"
import { GITHUB_REPO_URL } from "../constants"
import { PROJECT_STATS } from "../content"

// A single centered card making the open-core / AGPL case, with project stats and a repo CTA.
export const OpenSource = () => (
  <section id="opensource" className="mx-auto max-w-[1080px] px-7 py-[90px]">
    <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
      <Logomark size={46} className="mx-auto mb-[22px] rounded-[13px]" />
      <h2 className="m-0 text-[32px] font-semibold tracking-[-0.02em] text-foreground">Built in the open</h2>
      <p className="mx-auto mt-3.5 max-w-[540px] text-[15px] leading-[1.6] text-muted-foreground">
        Lagda is open-core and AGPL-3.0. Read every line, file an issue, or ship a PR — the roadmap is public.
      </p>
      <div className="my-[30px] mt-8 flex flex-wrap justify-center gap-9">
        {PROJECT_STATS.map((stat) => (
          <div key={stat.label}>
            <div className="font-mono text-[26px] font-semibold text-foreground">{stat.value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
      <Button asChild className="h-[42px] px-5 text-sm font-semibold">
        <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
          <span className="font-mono">★</span>
          github.com/lagda-dev/lagda
        </a>
      </Button>
    </div>
  </section>
)
