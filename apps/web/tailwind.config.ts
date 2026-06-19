import uiPreset from "@lagda/ui/preset"
import type { Config } from "tailwindcss"

export default {
  presets: [uiPreset],
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
} satisfies Config
