import { Logo } from "@lagda/ui"
import { FOOTER_COLUMNS } from "../content"

// Footer: brand blurb plus link columns, then a thin legal row.
export const SiteFooter = () => (
  <footer className="border-t border-border bg-background">
    <div className="mx-auto grid max-w-[1080px] grid-cols-2 gap-8 px-7 py-[52px] md:grid-cols-[2fr_1fr_1fr_1fr]">
      <div className="col-span-2 md:col-span-1">
        <Logo size={23} className="mb-3.5" />
        <p className="m-0 max-w-[240px] text-[12.5px] leading-[1.6] text-muted-foreground">Open-source, self-hostable email-signature management. AGPL-3.0.</p>
      </div>
      {FOOTER_COLUMNS.map((column) => (
        <div key={column.heading}>
          <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.06em] text-faint">{column.heading}</div>
          <div className="flex flex-col gap-[9px]">
            {column.links.map((link) => (
              <span key={link} className="cursor-pointer text-[13px] text-muted-foreground transition-colors hover:text-foreground">
                {link}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
    <div className="border-t border-border">
      <div className="mx-auto flex max-w-[1080px] flex-wrap justify-between gap-2.5 px-7 py-[18px]">
        <span className="font-mono text-[11px] text-faint">© 2026 lagda · AGPL-3.0</span>
        <span className="font-mono text-[11px] text-faint">Self-hosted with care.</span>
      </div>
    </div>
  </footer>
)
