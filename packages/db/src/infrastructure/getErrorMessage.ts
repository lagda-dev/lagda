// Shared error-message extractor. Wrap failures at their source with this so
// the original cause is never lost and callers never have to re-wrap.
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return String(error)
}
