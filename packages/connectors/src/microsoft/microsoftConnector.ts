import type { ConnectorInterface } from "../types"

// Message shared by every Microsoft connector method until the integration lands.
const NOT_IMPLEMENTED_MESSAGE = "NotImplemented: Microsoft connector is not available yet"

// TODO: deferred to a later milestone — implement Microsoft Graph directory reads and
// Exchange/Outlook signature writes here, behind the same injected-client pattern as Google.
export const createMicrosoftConnector = (): ConnectorInterface => {
  const listEmployees = async (): Promise<never> => {
    throw new Error(NOT_IMPLEMENTED_MESSAGE)
  }

  const deploySignature = async (): Promise<never> => {
    throw new Error(NOT_IMPLEMENTED_MESSAGE)
  }

  return { listEmployees, deploySignature }
}
