import type { Repository } from "./repository"
import { createAssignmentsRepository } from "./assignments/assignmentsRepository"
import { createAuditRepository } from "./audit/auditRepository"
import { createDirectoryRepository } from "./directory/directoryRepository"
import { createEmployeesRepository } from "./employees/employeesRepository"
import { createEntitiesRepository } from "./entities/entitiesRepository"
import { createOrganizationsRepository } from "./organizations/organizationsRepository"
import { buildPaginate, noopRecordDbQuery } from "./shared/paginate"
import type { LagdaDatabase, RecordDbQuery } from "./shared/paginate"
import { createSynchronizationsRepository } from "./synchronizations/synchronizationsRepository"
import { createTemplatesRepository } from "./templates/templatesRepository"

// Kysely-backed implementation of the data-access API — the only place the public API touches Postgres.
// Assembly only: build the shared paginate helper once, then spread each entity repository (one directory
// per repository under ./<entity>, each binding its one-action-per-file factories) into the `Repository`
// the routes depend on. Excluded from coverage (`vitest.config.ts`): it needs a live database and is
// integration-tested, while handlers are unit-tested against the mock repository.
export const createKyselyRepository = (db: LagdaDatabase, recordDbQuery: RecordDbQuery = noopRecordDbQuery): Repository => {
  const paginate = buildPaginate(recordDbQuery)
  return {
    ...createOrganizationsRepository(db, paginate),
    ...createEntitiesRepository(db, paginate),
    ...createEmployeesRepository(db, paginate),
    ...createTemplatesRepository(db, paginate),
    ...createAssignmentsRepository(db, paginate),
    ...createDirectoryRepository(db, paginate),
    ...createAuditRepository(db, paginate),
    ...createSynchronizationsRepository(db, paginate),
  }
}

// Re-exported so the server's wiring keeps a single import site for the data layer (`server.ts`).
export { createQueueEnqueuer } from "./queueEnqueuer"
