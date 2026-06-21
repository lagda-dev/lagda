import { createEntity } from "./createEntity"
import { findDefaultEntityId } from "./findDefaultEntityId"
import { getEntity } from "./getEntity"
import { listEntities } from "./listEntities"
import { updateEntity } from "./updateEntity"
import type { LagdaDatabase, Paginate } from "../shared/paginate"

// Assembly: bind each entity action to its dependencies.
export const createEntitiesRepository = (db: LagdaDatabase, paginate: Paginate) => ({
  listEntities: listEntities(db, paginate),
  getEntity: getEntity(db),
  createEntity: createEntity(db),
  updateEntity: updateEntity(db),
  findDefaultEntityId: findDefaultEntityId(db),
})
