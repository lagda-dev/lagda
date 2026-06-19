// Narrow an unknown thrown value to a human-readable message. Wrap at the source with this so
// callers never double-wrap and never leak a raw stack trace into a log line or HTTP response.
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return "Unexpected error"
}
