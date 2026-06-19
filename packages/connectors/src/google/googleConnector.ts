import type { ConnectorInterface, DirectoryEmployee } from "../types"
import type { GoogleClient } from "./googleClient"
import { toDirectoryEmployee } from "../mappers/googleUserMapper"
import { getErrorMessage } from "../getErrorMessage"

// The Google Workspace connector. The client is injected so the connector is fully mockable:
// the implementation holds the orchestration; the client holds the I/O.
export const createGoogleConnector = (client: GoogleClient): ConnectorInterface => {
  const listEmployees = async (): Promise<DirectoryEmployee[]> => {
    try {
      const directoryUsers = await client.listDirectoryUsers()
      return directoryUsers.map(toDirectoryEmployee)
    } catch (error) {
      throw new Error(`Failed to list employees from Google Workspace: ${getErrorMessage(error)}`)
    }
  }

  const deploySignature = async (email: string, html: string): Promise<void> => {
    try {
      await client.updateSendAsSignature(email, html)
    } catch (error) {
      throw new Error(`Failed to deploy signature to ${email} via Google Workspace: ${getErrorMessage(error)}`)
    }
  }

  return { listEmployees, deploySignature }
}
