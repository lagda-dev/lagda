import type { IntegrationInterface } from "../integration"
import { deploySignature } from "./deploySignature"
import { listEmployees } from "./listEmployees"

// The Microsoft integration (stub until the integration lands), assembled from its per-operation files —
// the same injected-operation pattern as Google.
export const createMicrosoftIntegration = (): IntegrationInterface => ({
  listEmployees: listEmployees(),
  deploySignature: deploySignature(),
})
