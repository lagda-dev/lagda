import { z } from "@hono/zod-openapi"

// The §15 discriminated `target` selector for a synchronization, expressed as a Zod discriminated
// union so the request body is validated at the boundary and narrowed safely downstream. Exactly one
// variant is accepted: a whole org, one entity, a department within an entity, a role, or an explicit
// list of users.
export const syncTargetSchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("org"), organizationId: z.string().min(1) }),
    z.object({ kind: z.literal("entity"), entityId: z.string().min(1) }),
    z.object({ kind: z.literal("department"), entityId: z.string().min(1), department: z.string().min(1) }),
    z.object({ kind: z.literal("role"), entityId: z.string().min(1), role: z.string().min(1) }),
    z.object({ kind: z.literal("users"), entityId: z.string().min(1), userIds: z.array(z.string().min(1)).nonempty() }),
  ])
  .openapi("SyncTarget")

export type SyncTargetInput = z.infer<typeof syncTargetSchema>

// The entity a target operates on, used to fan out the directory sync job. The `org` variant has no
// single entity, so the directory sync is enqueued at the org level (entityId resolves to the org's
// default entity in the data layer); for that case we pass the organization id through.
export const entityIdFromTarget = (target: SyncTargetInput): string => {
  if (target.kind === "org") {
    return target.organizationId
  }
  return target.entityId
}
