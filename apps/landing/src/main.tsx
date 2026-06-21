import "@fontsource-variable/geist"
import "@fontsource-variable/geist-mono"
import "@lagda/ui/styles.css"
import "./index.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { LandingPage } from "./LandingPage"

const rootElement = document.getElementById("root")
if (rootElement === null) throw new Error("Root element #root not found")

createRoot(rootElement).render(
  <StrictMode>
    <LandingPage />
  </StrictMode>,
)
