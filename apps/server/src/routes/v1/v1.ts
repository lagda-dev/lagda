import type { OpenAPIHono } from "@hono/zod-openapi"
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

// Mount every v1 resource onto the app in one place. Each `register*` chains its routes and returns
// the same app, so `AppType` stays accurate for the SPA's `hc<AppType>` client. Read top-to-bottom,
// this is the public API surface as a checklist.
export const registerV1Routes = (app: OpenAPIHono<{ Variables: AuthVariables }>, deps: ApiDependencies) => {
  registerOrganizations(app, deps)
  registerEntities(app, deps)
  registerEmployees(app, deps)
  registerTemplates(app, deps)
  registerAssignments(app, deps)
  registerSynchronizations(app, deps)
  registerDepartments(app, deps)
  registerRoles(app, deps)
  registerAuditEvents(app, deps)
  return app
}
