import { recordQuery } from "../../infrastructure/queryCounter"
import type { EmployeeRecord } from "../types"
import type { LagdaDatabase } from "../shared/paginate"

export const getEmployee =
  (db: LagdaDatabase) =>
  async (orgId: string, id: string): Promise<EmployeeRecord | null> => {
    recordQuery()
    const row = await db
      .selectFrom("employees")
      .innerJoin("entities", "entities.id", "employees.entity_id")
      .select([
        "employees.id as id",
        "employees.entity_id as entityId",
        "employees.email as email",
        "employees.first_name as firstName",
        "employees.last_name as lastName",
        "employees.department as department",
        "employees.job_title as jobTitle",
      ])
      .where("employees.id", "=", id)
      .where("entities.org_id", "=", orgId)
      .executeTakeFirst()
    return row ?? null
  }
