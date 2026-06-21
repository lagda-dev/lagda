import { SELF_HOST_POINTS } from "../content"

// Two-column section: the self-hosting pitch on the left, a faux terminal boot log on the right.
export const SelfHost = () => (
  <section id="selfhost" className="border-t border-border bg-subtle">
    <div className="mx-auto grid max-w-[1080px] grid-cols-1 items-center gap-14 px-7 py-[90px] md:grid-cols-2">
      <div>
        <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">Self-hosted</div>
        <h2 className="m-0 text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
          Runs on your infrastructure. Your data never leaves.
        </h2>
        <p className="mt-[18px] text-[15px] leading-[1.65] text-muted-foreground">
          No vendor reads your org chart. Lagda is a two-service monolith plus Postgres — boot the whole stack with one command, on your own servers, behind
          your own firewall.
        </p>
        <div className="mt-6 flex flex-col gap-[11px]">
          {SELF_HOST_POINTS.map((point) => (
            <div key={point.text} className="flex items-center gap-2.5">
              <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-foreground text-[10px] text-background">✓</span>
              <span className="text-[13.5px] text-body">{point.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
        <div className="flex items-center gap-[7px] border-b border-border bg-subtle px-3.5 py-2.5">
          <span className="h-[9px] w-[9px] rounded-full bg-border-strong" />
          <span className="h-[9px] w-[9px] rounded-full bg-border-strong" />
          <span className="h-[9px] w-[9px] rounded-full bg-border-strong" />
          <span className="ml-1.5 font-mono text-[11px] text-faint">~/lagda</span>
        </div>
        <div className="px-[18px] py-[18px] font-mono text-[12.5px] leading-[1.9]">
          <div className="text-faint"># clone and boot the whole stack</div>
          <div className="text-body">
            <span className="text-faint">$</span> git clone github.com/lagda-dev/lagda
          </div>
          <div className="text-body">
            <span className="text-faint">$</span> cd lagda
          </div>
          <div className="text-body">
            <span className="text-faint">$</span> docker compose up
          </div>
          <div className="h-2" />
          <div className="text-success">✓ postgres ready · migrations applied</div>
          <div className="text-success">✓ auth on :3100 · app on :3000</div>
          <div className="text-body">
            → open http://localhost:3000
            <span className="ml-1 inline-block h-3.5 w-[7px] animate-pulse-dot bg-foreground align-[-2px]" />
          </div>
        </div>
      </div>
    </div>
  </section>
)
