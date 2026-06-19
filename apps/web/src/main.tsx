import "@lagda/ui/styles.css"
import "./index.css"
import { PERMISSIONS } from "@lagda/auth-contract"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { RequireAuth } from "./auth/RequireAuth"
import { RequireRole } from "./auth/RequireRole"
import { AppShell } from "./components/AppShell"
import { DashboardPage } from "./pages/DashboardPage"
import { SettingsPage } from "./pages/SettingsPage"
import { LoginPage } from "./pages/auth/LoginPage"
import { VerifyOtpPage } from "./pages/auth/VerifyOtpPage"

const queryClient = new QueryClient()

// Public auth routes sit outside the shell; everything else is behind RequireAuth and rendered inside
// the role-aware AppShell. Owner-only areas additionally pass through RequireRole (UX gating; the server
// is the security boundary, §6).
const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/verify-otp", element: <VerifyOtpPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/", element: <DashboardPage /> },
          {
            element: <RequireRole permission={PERMISSIONS.MANAGE_ORG} />,
            children: [{ path: "/settings", element: <SettingsPage /> }],
          },
        ],
      },
    ],
  },
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
