import type { IntegrationInterface } from "../integration"
import { deploySignature } from "./deploySignature"
import type { GoogleClient } from "./googleClient"
import { listEmployees } from "./listEmployees"

// The Google Workspace integration. The client is injected so it is fully mockable: each operation lives
// in its own file (the I/O is the client's); this assembly binds them to the client.
export const createGoogleIntegration = (client: GoogleClient): IntegrationInterface => ({
  listEmployees: listEmployees(client),
  deploySignature: deploySignature(client),
})
