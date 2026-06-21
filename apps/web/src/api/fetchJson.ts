// A small, pure boundary between a `hc<AppType>` response promise and the typed JSON body the hooks
// hand to TanStack Query. Kept framework-free (no React) so it stays unit-testable in isolation, and it
// fails loud: any non-ok response throws an `ApiError` carrying the HTTP status and the resource that
// failed, instead of letting a query silently resolve with an error envelope.

// The shape every `hc<AppType>` call resolves to: a Fetch `Response` whose `.json()` yields the inferred
// body. We only depend on the two members we actually read, so any RPC response fits structurally.
export type RpcResponse<Body> = {
  ok: boolean
  status: number
  json: () => Promise<Body>
}

export class ApiError extends Error {
  readonly status: number
  readonly operation: string

  constructor(operation: string, status: number) {
    super(`Request "${operation}" failed with status ${status}`)
    this.name = "ApiError"
    this.status = status
    this.operation = operation
  }
}

// Await an RPC response, throw a contextual `ApiError` when it is not ok, otherwise return the parsed
// body. `operation` is the storytelling label used in the thrown message (e.g. "list employees").
export const fetchJson = async <Body>(operation: string, response: RpcResponse<Body>): Promise<Body> => {
  if (!response.ok) throw new ApiError(operation, response.status)
  return response.json()
}

// The no-body counterpart for `204 No Content` responses (deletes): same fail-loud `ApiError` boundary,
// but never reads `.json()` (a 204 has no body to parse). Every write path goes through one of these two
// helpers so error handling stays consistent and typed — never a hand-rolled `throw new Error`.
export const fetchVoid = async (operation: string, response: Pick<RpcResponse<unknown>, "ok" | "status">): Promise<void> => {
  if (!response.ok) throw new ApiError(operation, response.status)
}
