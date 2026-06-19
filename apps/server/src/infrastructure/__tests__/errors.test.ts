import { describe, expect, it } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { API_ERROR_STATUS, HttpError, buildApiError, sendApiError } from "../errors"

describe("buildApiError", () => {
  it("builds the envelope without details when none are given", () => {
    // Arrange + Act
    const envelope = buildApiError("not_found", "Resource not found")

    // Assert
    expect(envelope).toEqual({ error: { code: "not_found", message: "Resource not found" } })
    expect("details" in envelope.error).toBe(false)
  })

  it("includes details when provided", () => {
    // Arrange + Act
    const envelope = buildApiError("bad_request", "Invalid", { field: "limit" })

    // Assert
    expect(envelope.error.details).toEqual({ field: "limit" })
  })
})

describe("API_ERROR_STATUS", () => {
  it("maps each canonical code to its HTTP status", () => {
    // Assert
    expect(API_ERROR_STATUS.unauthorized).toBe(401)
    expect(API_ERROR_STATUS.forbidden).toBe(403)
    expect(API_ERROR_STATUS.rate_limited).toBe(429)
  })
})

describe("HttpError", () => {
  it("carries its code, message and details", () => {
    // Arrange + Act
    const error = new HttpError("conflict", "Already exists", { id: "1" })

    // Assert
    expect(error.code).toBe("conflict")
    expect(error.message).toBe("Already exists")
    expect(error.details).toEqual({ id: "1" })
  })
})

describe("sendApiError", () => {
  it("sends the envelope with the mapped status code", async () => {
    // Arrange
    const app = new OpenAPIHono().get("/boom", (ctx) => sendApiError(ctx, "forbidden", "Nope"))

    // Act
    const response = await app.request("/boom")
    const body = (await response.json()) as { error: { code: string; message: string } }

    // Assert
    expect(response.status).toBe(403)
    expect(body.error.code).toBe("forbidden")
    expect(body.error.message).toBe("Nope")
  })
})
