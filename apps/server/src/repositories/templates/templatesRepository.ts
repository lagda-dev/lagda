import { createTemplate } from "./createTemplate"
import { deleteTemplate } from "./deleteTemplate"
import { getTemplate } from "./getTemplate"
import { listTemplates } from "./listTemplates"
import { updateTemplate } from "./updateTemplate"
import type { LagdaDatabase, Paginate } from "../shared/paginate"

// Assembly: bind each template action to its dependencies.
export const createTemplatesRepository = (db: LagdaDatabase, paginate: Paginate) => ({
  listTemplates: listTemplates(db, paginate),
  getTemplate: getTemplate(db),
  createTemplate: createTemplate(db),
  updateTemplate: updateTemplate(db),
  deleteTemplate: deleteTemplate(db),
})
