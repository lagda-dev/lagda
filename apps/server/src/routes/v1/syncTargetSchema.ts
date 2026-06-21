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
