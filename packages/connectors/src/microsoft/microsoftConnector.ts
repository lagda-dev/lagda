import type { ConnectorInterface } from "../connector"
import { deploySignature } from "./deploySignature"
import { listEmployees } from "./listEmployees"

// The Microsoft connector (stub until the integration lands), assembled from its per-operation files —
// the same injected-operation pattern as Google.
export const createMicrosoftConnector = (): ConnectorInterface => ({
  listEmployees: listEmployees(),
  deploySignature: deploySignature(),
})
