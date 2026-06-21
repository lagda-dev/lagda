import { NOT_IMPLEMENTED_MESSAGE } from "./notImplemented"

// TODO: implement Microsoft Graph directory reads behind the same injected-client pattern as Google.
export const listEmployees = () => async (): Promise<never> => {
  throw new Error(NOT_IMPLEMENTED_MESSAGE)
}
