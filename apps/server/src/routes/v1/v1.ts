import type { OpenAPIHono } from "@hono/zod-openapi"
import type { Schema } from "hono"
import type { AuthVariables } from "../../middleware/authContext"
import type { ApiDependencies } from "./dependencies"
import { registerOrganizations } from "./organizations"
import { registerEntities } from "./entities"
import { registerEmployees } from "./employees"
import { registerTemplates } from "./templates"
import { registerAssignments } from "./assignments"
import { registerSynchronizations } from "./synchronizations"
import { registerDepartments } from "./departments"
import { registerRoles } from "./roles"
import { registerAuditEvents } from "./auditEvents"

// Mount every v1 resource onto the app in one place. Hono RPC only carries route types through the
// *return value* of each `.openapi(...)` chain, so we must thread each `register*` result into the
// next — the returned schema accumulates every resource's routes. The final return is what `AppType`
// is derived from in `app.ts`, which is what lets the SPA's `hc<AppType>` client see every resource
// (e.g. `client.api.v1.templates.$get`). Read top-to-bottom, this is the public API surface as a
// checklist; the runtime mounts are unchanged (same app instance, same `/api/v1/...` URLs).
export const registerV1Routes = <S extends Schema>(app: OpenAPIHono<{ Variables: AuthVariables }, S>, deps: ApiDependencies) => {
  const withOrganizations = registerOrganizations(app, deps)
  const withEntities = registerEntities(withOrganizations, deps)
  const withEmployees = registerEmployees(withEntities, deps)
  const withTemplates = registerTemplates(withEmployees, deps)
  const withAssignments = registerAssignments(withTemplates, deps)
  const withSynchronizations = registerSynchronizations(withAssignments, deps)
  const withDepartments = registerDepartments(withSynchronizations, deps)
  const withRoles = registerRoles(withDepartments, deps)
  // TODO(wave-4+): register write routes for notification-channels, application-tokens,
  // directory-connections, and users/members once those resources land (out of scope here; Slack
  // notifications are deferred).
  return registerAuditEvents(withRoles, deps)
}
