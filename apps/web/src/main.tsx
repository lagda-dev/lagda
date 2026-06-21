import "@fontsource-variable/geist"
import "@fontsource-variable/geist-mono"
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
import { AssignmentsPage } from "./pages/AssignmentsPage"
import { AuditEventsPage } from "./pages/AuditEventsPage"
import { DashboardPage } from "./pages/DashboardPage"
import { EmployeesPage } from "./pages/EmployeesPage"
import { EntitiesPage } from "./pages/EntitiesPage"
import { NotFoundPage } from "./pages/NotFoundPage"
import { SettingsPage } from "./pages/SettingsPage"
import { SynchronizationsPage } from "./pages/SynchronizationsPage"
import { TemplatesPage } from "./pages/TemplatesPage"
import { LoginPage } from "./pages/auth/LoginPage"
import { SignUpPage } from "./pages/auth/SignUpPage"
import { VerifyOtpPage } from "./pages/auth/VerifyOtpPage"

const queryClient = new QueryClient()

// Public auth routes sit outside the shell; everything else is behind RequireAuth and rendered inside
// the role-aware AppShell. Owner-only areas additionally pass through RequireRole (UX gating; the server
// is the security boundary, §6).
const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignUpPage /> },
  { path: "/verify-otp", element: <VerifyOtpPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/", element: <DashboardPage /> },
          {
            element: <RequireRole permission={PERMISSIONS.MANAGE_TEMPLATES} />,
            children: [
              { path: "/templates", element: <TemplatesPage /> },
              { path: "/assignments", element: <AssignmentsPage /> },
            ],
          },
          {
            element: <RequireRole permission={PERMISSIONS.RUN_SYNCS} />,
            children: [{ path: "/synchronizations", element: <SynchronizationsPage /> }],
          },
          {
            element: <RequireRole permission={PERMISSIONS.READ_EMPLOYEES} />,
            children: [{ path: "/employees", element: <EmployeesPage /> }],
          },
          {
            element: <RequireRole permission={PERMISSIONS.MANAGE_ENTITIES} />,
            children: [{ path: "/entities", element: <EntitiesPage /> }],
          },
          {
            element: <RequireRole permission={PERMISSIONS.MANAGE_ORG} />,
            children: [
              { path: "/audit-events", element: <AuditEventsPage /> },
              { path: "/settings", element: <SettingsPage /> },
            ],
          },
          { path: "*", element: <NotFoundPage /> },
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
