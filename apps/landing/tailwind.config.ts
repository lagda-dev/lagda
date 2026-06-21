import uiPreset from "@lagda/ui/preset"
import type { Config } from "tailwindcss"

export default {
  presets: [uiPreset],
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // The hero and product-mock cards use a deeper elevation than the preset's restrained
      // shadow scale (which favors 1px borders). Add a marketing-only "lg" shadow for them.
      boxShadow: {
        lg: "0 30px 60px -20px rgba(9, 9, 11, 0.22), 0 12px 24px -12px rgba(9, 9, 11, 0.12)",
      },
    },
  },
} satisfies Config
