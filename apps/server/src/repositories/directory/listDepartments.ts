import type { Page, PaginationQuery } from "../../infrastructure/pagination"
import type { DepartmentRecord } from "../types"
import type { LagdaDatabase, Paginate } from "../shared/paginate"

// The distinct departments present on the org's employees (populates assignment-target pickers).
export const listDepartments =
  (db: LagdaDatabase, paginate: Paginate) =>
  (orgId: string, query: PaginationQuery): Promise<Page<DepartmentRecord>> =>
    paginate({
      operation: "listDepartments",
      query,
      runRows: async (limit, cursor) => {
        let builder = db
          .selectFrom("employees")
          .innerJoin("entities", "entities.id", "employees.entity_id")
          .select("employees.department as name")
          .distinct()
          .where("entities.org_id", "=", orgId)
          .where("employees.department", "is not", null)
          .orderBy("employees.department")
          .limit(limit)
        if (cursor !== undefined) builder = builder.where("employees.department", ">", cursor)
        const rows = await builder.execute()
        return rows.map((row) => ({ name: row.name ?? "" }))
      },
      toCursor: (department) => department.name,
    })
