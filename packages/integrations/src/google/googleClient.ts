import { google, type Auth } from "googleapis"
import type { GoogleDirectoryUser } from "../mappers/googleUserMapper"
import { getErrorMessage } from "@lagda/core"

// The two Google API calls the integration depends on, behind a narrow port.
// Keeping this interface separate from the real implementation lets tests inject a mock
// without ever importing `googleapis`.
export type GoogleClient = {
  listDirectoryUsers: () => Promise<GoogleDirectoryUser[]>
  updateSendAsSignature: (email: string, html: string) => Promise<void>
}

// Read the whole customer's directory; we project organizations + names for the mapper.
const DIRECTORY_LIST_PROJECTION = "full"
const DIRECTORY_CUSTOMER = "my_customer"

// Builds the real Google client from an authenticated OAuth2 client. This is the only place
// in the package that touches `googleapis`; everything downstream depends on `GoogleClient`.
export const createGoogleClient = (auth: Auth.OAuth2Client): GoogleClient => {
  const directory = google.admin({ version: "directory_v1", auth })
  const gmail = google.gmail({ version: "v1", auth })

  const listDirectoryUsers = async (): Promise<GoogleDirectoryUser[]> => {
    try {
      const response = await directory.users.list({
        customer: DIRECTORY_CUSTOMER,
        projection: DIRECTORY_LIST_PROJECTION,
        viewType: "admin_view",
      })
      const users = response.data.users ?? []
      return users as GoogleDirectoryUser[]
    } catch (error) {
      throw new Error(`Failed to list Google directory users: ${getErrorMessage(error)}`)
    }
  }

  const updateSendAsSignature = async (email: string, html: string): Promise<void> => {
    try {
      await gmail.users.settings.sendAs.patch({
        userId: email,
        sendAsEmail: email,
        requestBody: { signature: html },
      })
    } catch (error) {
      throw new Error(`Failed to update Gmail sendAs signature for ${email}: ${getErrorMessage(error)}`)
    }
  }

  return { listDirectoryUsers, updateSendAsSignature }
}
