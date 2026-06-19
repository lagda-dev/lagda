import type { Config } from "tailwindcss"
import preset from "./src/tailwind-preset"

const config: Config = {
  presets: [preset],
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "./.storybook/**/*.{ts,tsx}"],
}

export default config
