import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { InferRequestType, InferResponseType } from "hono/client"
import { api } from "../client"
import { fetchJson } from "../fetchJson"
import { queryKeys } from "../queryKeys"
import { noIdempotencyHeader } from "./mutationHeaders"

// `application-tokens` — scoped bearer tokens for the REST API (MANAGE_TOKENS: owner/admin). Mint
// returns the plaintext secret ONCE (in `token`); list/revoke responses never carry it or the hash.
const tokens = api.api.v1["application-tokens"]

export type ApplicationTokenList = InferResponseType<typeof tokens.$get, 200>
export type ApplicationToken = ApplicationTokenList[number]
export type MintedApplicationToken = InferResponseType<typeof tokens.$post, 201>
export type MintApplicationTokenInput = InferRequestType<typeof tokens.$post>["json"]

const fetchApplicationTokens = async (): Promise<ApplicationTokenList> => fetchJson("list application tokens", await tokens.$get())

// Mint a token; the 201 body carries the one-time plaintext `token`. Mirrors the create-synchronization
// shape (201, not 200), so it builds the response directly rather than via the 200-only `fetchJson`.
const mintApplicationToken = async (input: MintApplicationTokenInput): Promise<MintedApplicationToken> => {
  const response = await tokens.$post({ json: input, ...noIdempotencyHeader })
  if (!response.ok) throw new Error(`Request "mint application token" failed with status ${response.status}`)
  return response.json()
}

const revokeApplicationToken = async (id: string): Promise<ApplicationToken> =>
  fetchJson(`revoke application token ${id}`, await tokens[":id"].revoke.$post({ param: { id }, ...noIdempotencyHeader }))

export const useApplicationTokensList = () => useQuery({ queryKey: queryKeys.applicationTokens.list(), queryFn: fetchApplicationTokens })

// A mint or a revoke changes the list, so both invalidate the namespace so the table refetches.
export const useMintApplicationToken = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: mintApplicationToken,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.applicationTokens.all })
    },
  })
}

export const useRevokeApplicationToken = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: revokeApplicationToken,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.applicationTokens.all })
    },
  })
}

export { fetchApplicationTokens, mintApplicationToken, revokeApplicationToken }
