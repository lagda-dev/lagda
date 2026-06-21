import type { Page, PaginationQuery } from "../../infrastructure/pagination"
import type { EmployeeRecord } from "../types"
import type { LagdaDatabase, Paginate } from "../shared/paginate"

// Employees have no direct org column, so scope by joining through the owning entity.
const EMPLOYEE_COLUMNS = [
  "employees.id as id",
  "employees.entity_id as entityId",
  "employees.email as email",
  "employees.first_name as firstName",
  "employees.last_name as lastName",
  "employees.department as department",
  "employees.job_title as jobTitle",
] as const

export const listEmployees =
  (db: LagdaDatabase, paginate: Paginate) =>
  (orgId: string, query: PaginationQuery): Promise<Page<EmployeeRecord>> =>
    paginate({
      operation: "listEmployees",
      query,
      runRows: async (limit, cursor) => {
        let builder = db
          .selectFrom("employees")
          .innerJoin("entities", "entities.id", "employees.entity_id")
          .select(EMPLOYEE_COLUMNS)
          .where("entities.org_id", "=", orgId)
          .orderBy("employees.id")
          .limit(limit)
        if (cursor !== undefined) builder = builder.where("employees.id", ">", cursor)
        return builder.execute()
      },
      toCursor: (employee) => employee.id,
    })
