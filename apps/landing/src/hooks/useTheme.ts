import { useEffect, useState } from "react"

export type Theme = "light" | "dark"

const STORAGE_KEY = "lagda-landing-theme"

// Resolve the initial theme once: an explicit prior choice wins, otherwise honor the OS preference.
const readInitialTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "light" || stored === "dark") return stored

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

// Drives the dark/light toggle. The token system (@lagda/ui) is class-based, so applying a theme is
// just toggling `dark` on the document root; the chosen value is persisted so it survives reloads.
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => setTheme((current) => (current === "dark" ? "light" : "dark"))

  return { theme, toggleTheme }
}
