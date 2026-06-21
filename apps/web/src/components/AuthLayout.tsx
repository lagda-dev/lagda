import { Card, CardContent, CardDescription, CardHeader, CardTitle, Logo } from "@lagda/ui"
import type { ReactNode } from "react"

// The shared chrome for every unauthenticated screen (sign in, sign up, verify): a centered card on a
// quiet dotted field, the brand lockup above it, and the self-hosted footer line below. Presentational
// only — each page supplies its own title, copy, and form via children.

const DOT_FIELD: Record<string, string> = {
  backgroundImage: "radial-gradient(circle at center, hsl(var(--border)) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
}

const DOT_FADE: Record<string, string> = {
  background: "radial-gradient(ellipse 70% 60% at 50% 45%, transparent, hsl(var(--subtle)))",
}

interface AuthLayoutProps {
  title: ReactNode
  description: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export const AuthLayout = ({ title, description, children, footer }: AuthLayoutProps) => (
  <main className="relative flex min-h-screen items-center justify-center bg-subtle px-6 py-10">
    <div aria-hidden className="pointer-events-none absolute inset-0" style={DOT_FIELD} />
    <div aria-hidden className="pointer-events-none absolute inset-0" style={DOT_FADE} />
    <div className="relative w-full max-w-sm">
      <div className="mb-7 flex justify-center">
        <Logo size={30} />
      </div>
      <Card className="shadow">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {footer ?? <p className="mt-6 text-center font-mono text-xs text-faint">Self-hosted · AGPL-3.0 · v0.1.0-beta</p>}
    </div>
  </main>
)
