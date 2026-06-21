// Single source of truth for turning an unknown thrown value into a human-readable message. Wrap errors
// at their source with this so callers never inspect `unknown`, never double-wrap, and never leak a raw
// stack trace into an HTTP envelope or a log line. It NEVER throws: the JSON fallback is guarded (a
// circular value would otherwise throw, and a stringified `undefined`/function returns no string).
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  try {
    return JSON.stringify(error) ?? String(error)
  } catch {
    return String(error)
  }
}
