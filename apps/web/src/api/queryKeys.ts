// The single source of truth for every TanStack Query key the SPA uses. Centralizing them here keeps
// invalidation honest: a mutation invalidates the exact same key its sibling query reads, and there are
// no stringly-typed keys scattered across resource modules. Each resource exposes a `list` (optionally
// scoped by a filter object) and a `detail(id)` key under a stable string namespace.

export type ListFilters = Record<string, string | number | undefined>

const listKey = (resource: string, filters?: ListFilters) => (filters === undefined ? ([resource, "list"] as const) : ([resource, "list", filters] as const))

const detailKey = (resource: string, id: string) => [resource, "detail", id] as const

export const queryKeys = {
  health: ["health"] as const,
  organizations: {
    all: ["organizations"] as const,
    list: (filters?: ListFilters) => listKey("organizations", filters),
    detail: (id: string) => detailKey("organizations", id),
  },
  entities: {
    all: ["entities"] as const,
    list: (filters?: ListFilters) => listKey("entities", filters),
    detail: (id: string) => detailKey("entities", id),
  },
  employees: {
    all: ["employees"] as const,
    list: (filters?: ListFilters) => listKey("employees", filters),
    detail: (id: string) => detailKey("employees", id),
  },
  templates: {
    all: ["templates"] as const,
    list: (filters?: ListFilters) => listKey("templates", filters),
    detail: (id: string) => detailKey("templates", id),
  },
  assignments: {
    all: ["assignments"] as const,
    list: (filters?: ListFilters) => listKey("assignments", filters),
    detail: (id: string) => detailKey("assignments", id),
  },
  synchronizations: {
    all: ["synchronizations"] as const,
    list: (filters?: ListFilters) => listKey("synchronizations", filters),
    detail: (id: string) => detailKey("synchronizations", id),
    deployments: (id: string, filters?: ListFilters) =>
      filters === undefined ? (["synchronizations", "deployments", id] as const) : (["synchronizations", "deployments", id, filters] as const),
  },
  departments: {
    all: ["departments"] as const,
    list: (filters?: ListFilters) => listKey("departments", filters),
  },
  roles: {
    all: ["roles"] as const,
    list: (filters?: ListFilters) => listKey("roles", filters),
  },
  auditEvents: {
    all: ["audit-events"] as const,
    list: (filters?: ListFilters) => listKey("audit-events", filters),
  },
} as const
