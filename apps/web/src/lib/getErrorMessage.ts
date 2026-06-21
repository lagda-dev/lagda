// Turn an unknown thrown value into a SAFE, user-facing message for the SPA. Unlike the server-side
// helper (which surfaces the raw message), the UI only trusts an Error's own message and otherwise shows
// a friendly fallback — so an unexpected internal value never leaks into the interface.
const FALLBACK_MESSAGE = "Something went wrong. Please try again."

export const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : FALLBACK_MESSAGE)
