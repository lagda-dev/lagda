interface CoverageRow {
  entity: string
  percent: number
}

const COVERAGE_ROWS: readonly CoverageRow[] = [
  { entity: "Acme HQ", percent: 94 },
  { entity: "Acme EU", percent: 81 },
  { entity: "Acme Labs", percent: 76 },
]

const SIDEBAR_ITEM_WIDTHS = [64, 50, 72, 58, 46]

interface DashboardMetric {
  label: string
  value: string
}

const DASHBOARD_METRICS: readonly DashboardMetric[] = [
  { label: "Coverage", value: "87%" },
  { label: "Employees", value: "248" },
  { label: "Deployed", value: "1,204" },
]

// A faux browser window showing the Lagda dashboard — pure decoration that anchors the hero.
export const ProductMock = () => (
  <div className="relative mx-auto mt-16 max-w-[1000px]">
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      <div className="flex items-center gap-[7px] border-b border-border bg-subtle px-4 py-[11px]">
        <span className="h-[11px] w-[11px] rounded-full bg-border-strong" />
        <span className="h-[11px] w-[11px] rounded-full bg-border-strong" />
        <span className="h-[11px] w-[11px] rounded-full bg-border-strong" />
        <div className="mx-auto flex items-center gap-[7px] rounded-md border border-border bg-background px-3.5 py-1 font-mono text-[11px] text-muted-foreground">
          <span className="h-[5px] w-[5px] rounded-full bg-success" />
          acme.lagda.dev/dashboard
        </div>
      </div>
      <div className="flex h-[380px]">
        <div className="w-[170px] flex-none border-r border-border bg-subtle p-3">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-[22px] w-[22px] flex-none rounded-md bg-foreground" />
            <div className="h-[9px] w-[54px] rounded bg-border-strong" />
          </div>
          <div className="my-2.5 h-2 w-[38px] rounded bg-border" />
          <div className="mb-[5px] h-7 rounded-md bg-hover" />
          {SIDEBAR_ITEM_WIDTHS.map((width) => (
            <div key={width} className="mb-[5px] flex h-7 items-center rounded-md pl-2.5">
              <div className="h-[7px] rounded bg-border-strong" style={{ width }} />
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-hidden px-6 py-[22px] text-left">
          <div className="mb-[18px] flex items-baseline gap-2.5">
            <span className="text-[17px] font-semibold text-foreground">Dashboard</span>
            <span className="rounded border border-border-strong px-[7px] py-px font-mono text-[10px] text-body">Owner</span>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-3">
            {DASHBOARD_METRICS.map((metric) => (
              <div key={metric.label} className="rounded-[9px] border border-border p-[13px]">
                <div className="font-mono text-[9px] uppercase tracking-[0.05em] text-muted-foreground">{metric.label}</div>
                <div className="mt-1.5 font-mono text-[23px] font-semibold text-foreground">{metric.value}</div>
              </div>
            ))}
          </div>
          <div className="rounded-[9px] border border-border p-4">
            <div className="mb-3.5 text-[12.5px] font-semibold text-foreground">Coverage by entity</div>
            {COVERAGE_ROWS.map((row) => (
              <div key={row.entity} className="mb-3 last:mb-0">
                <div className="mb-[7px] flex justify-between">
                  <span className="whitespace-nowrap text-[11.5px] text-body">{row.entity}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{row.percent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-hover">
                  <div className="h-full bg-foreground" style={{ width: `${row.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)
