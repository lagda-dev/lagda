import type { ConnectorInterface } from "../connector"
import { deploySignature } from "./deploySignature"
import type { GoogleClient } from "./googleClient"
import { listEmployees } from "./listEmployees"

// The Google Workspace connector. The client is injected so it is fully mockable: each operation lives
// in its own file (the I/O is the client's); this assembly binds them to the client.
export const createGoogleConnector = (client: GoogleClient): ConnectorInterface => ({
  listEmployees: listEmployees(client),
  deploySignature: deploySignature(client),
})
