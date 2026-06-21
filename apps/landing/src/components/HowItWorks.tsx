import { STEPS } from "../content"
import { SectionHeading } from "./SectionHeading"

// Three numbered cards walking through connect → design → sync.
export const HowItWorks = () => (
  <section id="how" className="mx-auto max-w-[1080px] px-7 py-20">
    <SectionHeading eyebrow="How it works" title="Live in three steps" />
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {STEPS.map((step) => (
        <div key={step.number} className="rounded-lg border border-border bg-card p-[26px] shadow-sm">
          <div className="mb-[18px] flex h-[30px] w-[30px] items-center justify-center rounded-md bg-foreground font-mono text-[13px] font-semibold text-primary-foreground">
            {step.number}
          </div>
          <h3 className="m-0 text-base font-semibold text-foreground">{step.title}</h3>
          <p className="mt-2.5 text-[13.5px] leading-[1.6] text-muted-foreground">{step.description}</p>
        </div>
      ))}
    </div>
  </section>
)
