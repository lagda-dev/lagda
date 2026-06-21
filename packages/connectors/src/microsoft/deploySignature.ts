import { NOT_IMPLEMENTED_MESSAGE } from "./notImplemented"

// TODO: implement Exchange/Outlook signature writes behind the same injected-client pattern as Google.
export const deploySignature = () => async (): Promise<never> => {
  throw new Error(NOT_IMPLEMENTED_MESSAGE)
}
