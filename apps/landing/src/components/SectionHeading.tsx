interface SectionHeadingProps {
  eyebrow: string
  title: string
  subtitle?: string
}

// The centered eyebrow + title (+ optional subtitle) lockup shared by the Features and How-it-works
// sections.
export const SectionHeading = ({ eyebrow, title, subtitle }: SectionHeadingProps) => (
  <div className="mb-12 text-center">
    <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">{eyebrow}</div>
    <h2 className="m-0 text-[38px] font-semibold tracking-[-0.025em] text-foreground">{title}</h2>
    {subtitle ? <p className="mx-auto mt-4 max-w-[560px] text-base leading-[1.6] text-muted-foreground">{subtitle}</p> : null}
  </div>
)
