import { FEATURES } from "../content"
import { SectionHeading } from "./SectionHeading"

// The capability grid: one card per feature, glyph + title + blurb.
export const Features = () => (
  <section id="features" className="mx-auto max-w-[1080px] px-7 pb-10 pt-[100px]">
    <SectionHeading
      eyebrow="Everything you need"
      title="One source of truth for every signature"
      subtitle="From directory to inbox, Lagda handles the whole pipeline — without a SaaS reading your org chart."
    />
    <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((feature) => (
        <div key={feature.title} className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-border bg-hover font-mono text-[13px] font-semibold text-foreground">
            {feature.glyph}
          </div>
          <h3 className="m-0 text-[15px] font-semibold text-foreground">{feature.title}</h3>
          <p className="mt-2 text-[13.5px] leading-[1.55] text-muted-foreground">{feature.description}</p>
        </div>
      ))}
    </div>
  </section>
)
