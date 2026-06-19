import type { Context } from "hono"
import { z } from "zod"

// The single error shape for the whole public API (§4): `{ error: { code, message, details? } }`.
// Every failing handler translates to this envelope with the right HTTP status code.

export const API_ERROR_CODES = ["bad_request", "unauthorized", "forbidden", "not_found", "conflict", "rate_limited", "internal_error"] as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[number]

// The status code each canonical error code maps to. Centralized so the envelope and the HTTP
// status never drift apart.
export const API_ERROR_STATUS = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  internal_error: 500,
} as const satisfies Record<ApiErrorCode, number>

export type ApiErrorStatus = (typeof API_ERROR_STATUS)[ApiErrorCode]

// The error envelope as a value: a code, a safe client-facing message, and optional structured
// details (e.g. Zod validation issues). Never put PII or stack traces in `details`.
export type ApiError = {
  error: {
    code: ApiErrorCode
    message: string
    details?: unknown
  }
}

// The Zod schema for the envelope, reused by every `@hono/zod-openapi` route as its error response
// schema so the OpenAPI document documents one consistent error shape.
export const apiErrorSchema = z
  .object({
    error: z
      .object({
        code: z.enum(API_ERROR_CODES),
        message: z.string(),
        details: z.unknown().optional(),
      })
      .openapi("ApiErrorBody"),
  })
  .openapi("ApiError")

// Build the envelope value without touching HTTP — pure, so it is trivially unit-tested.
export const buildApiError = (code: ApiErrorCode, message: string, details?: unknown): ApiError => {
  const base = { code, message }
  const errorBody = details === undefined ? base : { ...base, details }
  return { error: errorBody }
}

// A thrown error that already knows its envelope code, message, and details. Handlers throw this
// and the boundary turns it into the §4 response with the matching status code.
export class HttpError extends Error {
  public readonly code: ApiErrorCode
  public readonly details?: unknown

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = "HttpError"
    this.code = code
    this.details = details
  }
}

// Send the envelope with the status code mapped from its code. Returns the Hono `Response` so a
// handler can `return sendApiError(ctx, ...)`. Details are carried inside the envelope (built by
// `buildApiError`) rather than as a separate argument, keeping the signature small.
export const sendApiError = (ctx: Context, code: ApiErrorCode, message: string): Response => {
  const status = API_ERROR_STATUS[code]
  return ctx.json(buildApiError(code, message), status)
}
