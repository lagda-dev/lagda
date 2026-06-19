import { hc } from "hono/client"
import type { InferRequestType, InferResponseType } from "hono/client"
import { describe, expectTypeOf, it } from "vitest"
import type { AppType } from "../app"

// Type-level guard: `AppType` must carry the `/api/v1/*` resource routes so the SPA's typed RPC
// client (`hc<AppType>`) can reach every resource — not just the system probes. Hono accumulates
// route types only through the chained `.openapi(...)` return value, so if `registerV1Routes` ever
// stops threading a resource's router into the next, that resource drops out of `AppType` and the
// references below stop type-checking. This file is checked by `tsc --noEmit` (the typecheck task)
// and by Vitest's type runner; it ships no runtime assertions of its own.

const client = hc<AppType>("/")

describe("AppType exposes the v1 resources through hc<AppType>", () => {
  it("reaches templates, synchronizations and organizations as typed accessors", () => {
    // These accessors only exist when the matching route is part of `AppType`. A regression that
    // drops a resource from the chain turns each of these into `never`/`undefined` and fails typecheck.
    expectTypeOf(client.api.v1.templates.$get).toBeFunction()
    expectTypeOf(client.api.v1.templates[":id"].$get).toBeFunction()
    expectTypeOf(client.api.v1.synchronizations.$get).toBeFunction()
    expectTypeOf(client.api.v1.synchronizations.$post).toBeFunction()
    expectTypeOf(client.api.v1.organizations.$get).toBeFunction()
    expectTypeOf(client.api.v1.organizations[":id"].$get).toBeFunction()
  })

  it("infers request and response types for a v1 resource end to end", () => {
    // The POST body for a synchronization must be inferred from the server's Zod schema — proving the
    // input type flows through, not just the route key.
    type CreateSyncRequest = InferRequestType<typeof client.api.v1.synchronizations.$post>
    expectTypeOf<CreateSyncRequest>().toHaveProperty("json")

    type TemplatesResponse = InferResponseType<typeof client.api.v1.templates.$get, 200>
    expectTypeOf<TemplatesResponse>().toHaveProperty("data")
    expectTypeOf<TemplatesResponse>().toHaveProperty("nextCursor")
  })
})
