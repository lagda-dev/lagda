import type { DirectoryEmployee } from "./types"

// The capability surface every integration exposes, regardless of the underlying provider — the package's
// public API contract, kept apart from the record shapes in types.ts. `listEmployees` reads the
// directory; `deploySignature` writes a recipient's signature HTML.
export type IntegrationInterface = {
  listEmployees: () => Promise<DirectoryEmployee[]>
  deploySignature: (email: string, html: string) => Promise<void>
}
