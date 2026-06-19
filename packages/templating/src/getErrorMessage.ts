// Single source of truth for turning an unknown thrown value into a readable string.
// Used to wrap errors at their source so callers never have to inspect `unknown`.
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return JSON.stringify(error)
}
