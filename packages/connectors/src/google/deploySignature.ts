import { getErrorMessage } from "@lagda/core"
import type { GoogleClient } from "./googleClient"

// Write a recipient's signature HTML to their Gmail send-as settings.
export const deploySignature =
  (client: GoogleClient) =>
  async (email: string, html: string): Promise<void> => {
    try {
      await client.updateSendAsSignature(email, html)
    } catch (error) {
      throw new Error(`Failed to deploy signature to ${email} via Google Workspace: ${getErrorMessage(error)}`)
    }
  }
