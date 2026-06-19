// Narrow an unknown thrown value into a safe, human-readable message so every error is wrapped at its
// source with real context (§3) instead of leaking raw objects or losing the original cause.
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Unexpected error"
}
