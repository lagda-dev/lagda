import { getErrorMessage } from "@lagda/core"
import type { DirectoryEmployee } from "../types"
import { toDirectoryEmployee } from "../mappers/googleUserMapper"
import type { GoogleClient } from "./googleClient"

// Read the Google Workspace directory and normalise each user to a DirectoryEmployee.
export const listEmployees = (client: GoogleClient) => async (): Promise<DirectoryEmployee[]> => {
  try {
    const directoryUsers = await client.listDirectoryUsers()
    return directoryUsers.map(toDirectoryEmployee)
  } catch (error) {
    throw new Error(`Failed to list employees from Google Workspace: ${getErrorMessage(error)}`)
  }
}
