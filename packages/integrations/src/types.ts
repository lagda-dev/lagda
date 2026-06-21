// A single person read from a workspace directory, normalized to the shape Lagda cares about.
// `department` and `jobTitle` are nullable because directories frequently omit them.
export type DirectoryEmployee = {
  email: string
  firstName: string
  lastName: string
  department: string | null
  jobTitle: string | null
}
