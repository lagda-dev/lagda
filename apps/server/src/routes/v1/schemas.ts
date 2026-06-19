import { z } from "@hono/zod-openapi"
import { apiErrorSchema } from "../../infrastructure/errors"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../infrastructure/pagination"

// Shared OpenAPI building blocks reused by every v1 resource: the validated list query, the path-id
// param, the standard error responses, and a helper to document a paginated `{ data, nextCursor }`
// envelope. Centralized so the §4 conventions are expressed in exactly one place.

// The cursor-pagination query (`?cursor=&limit=`) as an OpenAPI-aware schema.
export const listQuerySchema = z.object({
  cursor: z
    .string()
    .min(1)
    .optional()
    .openapi({ param: { name: "cursor", in: "query" }, example: "eyJpZCI6IjEifQ" }),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE)
    .openapi({ param: { name: "limit", in: "query" }, example: DEFAULT_PAGE_SIZE }),
})

// The `{id}` path parameter shared by every item/sub-resource route.
export const idParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: "id", in: "path" }, example: "550e8400-e29b-41d4-a716-446655440000" }),
})

// The `Idempotency-Key` header accepted (optional) on every POST (§4). The schema key matches the
// param name so the OpenAPI generator sees a single, consistent header name.
export const idempotencyHeaderSchema = z.object({
  "idempotency-key": z
    .string()
    .min(1)
    .optional()
    .openapi({ param: { name: "idempotency-key", in: "header" } }),
})

// Wrap an item schema in the documented page envelope.
export const pageResponseSchema = <TSchema extends z.ZodTypeAny>(itemSchema: TSchema) =>
  z.object({
    data: z.array(itemSchema),
    nextCursor: z.string().nullable(),
  })

// The error responses every protected route can return, documented once.
export const errorResponses = {
  400: { description: "Invalid request", content: { "application/json": { schema: apiErrorSchema } } },
  401: { description: "Authentication required", content: { "application/json": { schema: apiErrorSchema } } },
  403: { description: "Insufficient permissions", content: { "application/json": { schema: apiErrorSchema } } },
  404: { description: "Resource not found", content: { "application/json": { schema: apiErrorSchema } } },
  429: { description: "Rate limit exceeded", content: { "application/json": { schema: apiErrorSchema } } },
} as const
