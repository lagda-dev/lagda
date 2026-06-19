// A single person read from a workspace directory, normalized to the shape Lagda cares about.
// `department` and `jobTitle` are nullable because directories frequently omit them.
export type DirectoryEmployee = {
  email: string
  firstName: string
  lastName: string
  department: string | null
  jobTitle: string | null
}

// The capability surface every connector exposes, regardless of the underlying provider.
// `listEmployees` reads the directory; `deploySignature` writes a recipient's signature HTML.
export type ConnectorInterface = {
  listEmployees: () => Promise<DirectoryEmployee[]>
  deploySignature: (email: string, html: string) => Promise<void>
}
