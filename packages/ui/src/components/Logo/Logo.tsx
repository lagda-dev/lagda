import type { HTMLAttributes } from "react"
import { cn } from "../../lib/utils"

const MARK_RADIUS_RATIO = 0.28
const WORDMARK_SIZE_RATIO = 0.65
const WORDMARK_GAP_RATIO = 0.3

export interface LogomarkProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
}

// The lagda mark: an "l" resting on a signature line — the act of signing reduced to two strokes.
// Colors are token-driven (foreground on background) so the mark inverts cleanly in dark mode.
export const Logomark = ({ size = 28, className, style, ...props }: LogomarkProps) => (
  <div
    aria-hidden
    className={cn("relative flex-none bg-foreground", className)}
    style={{ width: size, height: size, borderRadius: size * MARK_RADIUS_RATIO, ...style }}
    {...props}
  >
    <span className="absolute rounded-full bg-background" style={{ left: "38%", top: "24%", width: "9%", height: "36%" }} />
    <span className="absolute rounded-full bg-background" style={{ left: "26%", top: "64%", width: "48%", height: "9%" }} />
  </div>
)

export interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  showWordmark?: boolean
}

// The full lockup: mark plus the lowercase "lagda" wordmark, scaled to the mark size.
export const Logo = ({ size = 28, showWordmark = true, className, style, ...props }: LogoProps) => (
  <div className={cn("flex items-center", className)} style={{ gap: size * WORDMARK_GAP_RATIO, ...style }} {...props}>
    <Logomark size={size} />
    {showWordmark ? (
      <span className="font-semibold tracking-tight text-foreground" style={{ fontSize: size * WORDMARK_SIZE_RATIO, letterSpacing: "-0.03em" }}>
        lagda
      </span>
    ) : null}
  </div>
)
