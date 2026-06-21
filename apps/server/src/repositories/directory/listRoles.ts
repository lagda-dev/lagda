import { toPage } from "../../infrastructure/pagination"
import type { Page, PaginationQuery } from "../../infrastructure/pagination"
import type { RoleRecord } from "../types"

// Roles are a fixed vocabulary, not a table — page over the in-memory list so the shape matches.
const ROLE_NAMES: readonly RoleRecord[] = [{ name: "owner" }, { name: "admin" }, { name: "user" }]

export const listRoles =
  () =>
  async (_orgId: string, query: PaginationQuery): Promise<Page<RoleRecord>> =>
    toPage(ROLE_NAMES, query.limit, (role) => role.name)
