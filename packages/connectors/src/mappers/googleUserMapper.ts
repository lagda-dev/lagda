import type { DirectoryEmployee } from "../types"

// The minimal slice of a Google Admin SDK Directory user that the mapper reads.
// The SDK returns far more; we declare only the fields we consume to keep the mapper honest.
export type GoogleDirectoryUser = {
  primaryEmail: string
  name?: {
    givenName?: string | null
    familyName?: string | null
  } | null
  organizations?: ReadonlyArray<{
    department?: string | null
    title?: string | null
  }> | null
}

// Pure translation from a raw Admin SDK user to Lagda's domain employee. No I/O.
// The Admin SDK exposes department and job title on the user's primary organization entry.
export const toDirectoryEmployee = (raw: GoogleDirectoryUser): DirectoryEmployee => {
  const { primaryEmail, name, organizations } = raw
  const primaryOrganization = organizations?.[0]
  return {
    email: primaryEmail,
    firstName: name?.givenName ?? "",
    lastName: name?.familyName ?? "",
    department: primaryOrganization?.department ?? null,
    jobTitle: primaryOrganization?.title ?? null,
  }
}
