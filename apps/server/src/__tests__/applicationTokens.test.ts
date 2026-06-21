import { describe, expect, it } from "vitest"
import { createApp } from "../app"
import { bearer, buildDeps, createMockApplicationTokenStore, verifierFor } from "./fixtures"

// Routes for /api/v1/application-tokens (§4, §6): mint/list/revoke, owner+admin only (MANAGE_TOKENS).
// Driven against the in-memory store so the full mint→list→revoke flow is exercised without a DB; the
// plaintext secret is returned only at mint and the hash is never exposed.

const headers = { ...bearer(), "content-type": "application/json" }

describe("application tokens", () => {
  it("mints a token (201) returning the one-time plaintext, never the hash", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act
    const response = await app.request("/api/v1/application-tokens", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "CI", scopes: ["syncs:read", "syncs:write"] }),
    })
    const body = (await response.json()) as Record<string, unknown>

    // Assert
    expect(response.status).toBe(201)
    expect(typeof body.token).toBe("string")
    expect((body.token as string).startsWith("lagda_at_")).toBe(true)
    expect(body).toMatchObject({ name: "CI", scopes: ["syncs:read", "syncs:write"], revokedAt: null })
    expect(body.id).toBeDefined()
    expect(body.hashedToken).toBeUndefined()
    expect(JSON.stringify(body)).not.toContain("hashed")
  })

  it("lists the org's tokens without the secret or the hash", async () => {
    // Arrange — mint one, then list, against the same store
    const applicationTokenStore = createMockApplicationTokenStore()
    const app = createApp(buildDeps({ applicationTokenStore }))
    await app.request("/api/v1/application-tokens", { method: "POST", headers, body: JSON.stringify({ name: "CI", scopes: ["syncs:read"] }) })

    // Act
    const response = await app.request("/api/v1/application-tokens", { headers: bearer() })
    const body = (await response.json()) as Array<Record<string, unknown>>

    // Assert
    expect(response.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0]).toMatchObject({ name: "CI", scopes: ["syncs:read"], revokedAt: null })
    expect(body[0]?.token).toBeUndefined()
    expect(body[0]?.hashedToken).toBeUndefined()
  })

  it("revokes a token (200) and 404s an unknown id", async () => {
    // Arrange
    const applicationTokenStore = createMockApplicationTokenStore()
    const app = createApp(buildDeps({ applicationTokenStore }))
    const minted = (await (
      await app.request("/api/v1/application-tokens", { method: "POST", headers, body: JSON.stringify({ name: "CI", scopes: ["syncs:read"] }) })
    ).json()) as { id: string }

    // Act
    const revoke = await app.request(`/api/v1/application-tokens/${minted.id}/revoke`, { method: "POST", headers })
    const missing = await app.request("/api/v1/application-tokens/nope/revoke", { method: "POST", headers })
    const revokedBody = (await revoke.json()) as Record<string, unknown>

    // Assert
    expect(revoke.status).toBe(200)
    expect(revokedBody.revokedAt).not.toBeNull()
    expect(missing.status).toBe(404)
  })

  it("rejects an empty scope list with a 400", async () => {
    const app = createApp(buildDeps())
    const response = await app.request("/api/v1/application-tokens", { method: "POST", headers, body: JSON.stringify({ name: "CI", scopes: [] }) })
    expect(response.status).toBe(400)
  })

  it("denies a plain user (403) — MANAGE_TOKENS is owner/admin only", async () => {
    const app = createApp(buildDeps({ verifyToken: verifierFor("user") }))
    const list = await app.request("/api/v1/application-tokens", { headers: bearer() })
    const mint = await app.request("/api/v1/application-tokens", { method: "POST", headers, body: JSON.stringify({ name: "x", scopes: ["syncs:read"] }) })
    expect(list.status).toBe(403)
    expect(mint.status).toBe(403)
  })

  it("allows an admin (MANAGE_TOKENS granted to admin)", async () => {
    const app = createApp(buildDeps({ verifyToken: verifierFor("admin") }))
    const response = await app.request("/api/v1/application-tokens", { headers: bearer() })
    expect(response.status).toBe(200)
  })
})
