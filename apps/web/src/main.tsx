import "@lagda/ui/styles.css"
import "./index.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { DashboardPage } from "./pages/DashboardPage"
import { SettingsPage } from "./pages/SettingsPage"

const queryClient = new QueryClient()

const router = createBrowserRouter([
  { path: "/", element: <DashboardPage /> },
  { path: "/settings", element: <SettingsPage /> },
])

const rootElement = document.getElementById("root")
if (rootElement === null) throw new Error("Root element #root not found")

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
