import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@lagda/ui"
import type { Entity } from "../api/resources/entities"

// The §15 discriminated target control for an assignment, mirroring the server's `syncTargetSchema`
// discriminated union: exactly one of org / entity / department / role / users. This is presentational —
// it holds no fetching, takes the entity options as props, and reports a fully-formed target up via
// `onChange`. The server re-validates the shape (the UI is never the security boundary, §6).

// The discriminant the server narrows on. Kept as a const tuple so the kind picker and the type derive
// from one source.
export const TARGET_KINDS = ["org", "entity", "department", "role", "users"] as const
export type TargetKind = (typeof TARGET_KINDS)[number]

// The SPA-side mirror of `SyncTargetInput`. The server owns the canonical Zod schema; this is the shape
// the form assembles and POSTs (validated again server-side before it is trusted).
export type AssignmentTarget =
  | { kind: "org"; organizationId: string }
  | { kind: "entity"; entityId: string }
  | { kind: "department"; entityId: string; department: string }
  | { kind: "role"; entityId: string; role: string }
  | { kind: "users"; entityId: string; userIds: string[] }

const TARGET_KIND_LABELS: Record<TargetKind, string> = {
  org: "Whole organization",
  entity: "One entity",
  department: "A department",
  role: "A role",
  users: "Specific users",
}

// A blank target for a freshly-picked kind, so switching kinds never carries stale fields from the
// previous variant. The first entity (if any) seeds the entity-scoped variants.
const emptyTargetForKind = (kind: TargetKind, organizationId: string, firstEntityId: string): AssignmentTarget => {
  if (kind === "org") return { kind: "org", organizationId }
  if (kind === "entity") return { kind: "entity", entityId: firstEntityId }
  if (kind === "department") return { kind: "department", entityId: firstEntityId, department: "" }
  if (kind === "role") return { kind: "role", entityId: firstEntityId, role: "" }
  return { kind: "users", entityId: firstEntityId, userIds: [] }
}

// Parse the comma/newline-separated users textarea into a trimmed, non-empty id list (immutably).
const parseUserIds = (raw: string): string[] =>
  raw
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

interface AssignmentTargetSelectorProps {
  value: AssignmentTarget
  organizationId: string
  entities: readonly Entity[]
  onChange: (target: AssignmentTarget) => void
}

export const AssignmentTargetSelector = ({ value, organizationId, entities, onChange }: AssignmentTargetSelectorProps) => {
  const firstEntityId = entities[0]?.id ?? ""

  const onKindChange = (rawKind: string) => {
    const kind = rawKind as TargetKind
    onChange(emptyTargetForKind(kind, organizationId, firstEntityId))
  }

  // Entity-scoped variants (everything but `org`) share an entity picker, so we read the current entityId
  // from whichever variant is active rather than branching per kind.
  const activeEntityId = value.kind === "org" ? "" : value.entityId

  const onEntityChange = (entityId: string) => {
    if (value.kind === "org") return
    onChange({ ...value, entityId })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="target-kind">Target</Label>
        <Select value={value.kind} onValueChange={onKindChange}>
          <SelectTrigger id="target-kind" aria-label="Target kind">
            <SelectValue placeholder="Choose a target" />
          </SelectTrigger>
          <SelectContent>
            {TARGET_KINDS.map((kind) => (
              <SelectItem key={kind} value={kind}>
                {TARGET_KIND_LABELS[kind]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value.kind !== "org" && (
        <div className="space-y-2">
          <Label htmlFor="target-entity">Entity</Label>
          <Select value={activeEntityId} onValueChange={onEntityChange}>
            <SelectTrigger id="target-entity" aria-label="Target entity">
              <SelectValue placeholder="Choose an entity" />
            </SelectTrigger>
            <SelectContent>
              {entities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {value.kind === "department" && (
        <div className="space-y-2">
          <Label htmlFor="target-department">Department</Label>
          <Input
            id="target-department"
            value={value.department}
            placeholder="e.g. Engineering"
            onChange={(event) => onChange({ ...value, department: event.target.value })}
          />
        </div>
      )}

      {value.kind === "role" && (
        <div className="space-y-2">
          <Label htmlFor="target-role">Role</Label>
          <Input id="target-role" value={value.role} placeholder="e.g. Manager" onChange={(event) => onChange({ ...value, role: event.target.value })} />
        </div>
      )}

      {value.kind === "users" && (
        <div className="space-y-2">
          <Label htmlFor="target-users">User IDs</Label>
          <Input
            id="target-users"
            value={value.userIds.join(", ")}
            placeholder="Comma-separated user IDs"
            onChange={(event) => onChange({ ...value, userIds: parseUserIds(event.target.value) })}
          />
        </div>
      )}
    </div>
  )
}

export { emptyTargetForKind, parseUserIds }
