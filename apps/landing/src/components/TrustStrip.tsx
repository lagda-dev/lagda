import { Fragment } from "react"
import { TRUST_STATS } from "../content"

// A thin band of headline numbers between the hero and the feature grid.
export const TrustStrip = () => (
  <section className="border-y border-border bg-subtle">
    <div className="mx-auto flex max-w-[1080px] flex-wrap justify-between gap-6 p-7">
      {TRUST_STATS.map((stat, index) => (
        <Fragment key={stat.label}>
          {index > 0 ? <div className="w-px bg-border" /> : null}
          <div>
            <div className="font-mono text-2xl font-semibold text-foreground">{stat.value}</div>
            <div className="mt-[3px] text-[12.5px] text-muted-foreground">{stat.label}</div>
          </div>
        </Fragment>
      ))}
    </div>
  </section>
)
