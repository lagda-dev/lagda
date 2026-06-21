import type { Pool } from "pg"
import { describe, expect, it, vi } from "vitest"
import { provisionAppOrganization } from "../provisionAppOrganization"

// The provisioner runs two idempotent inserts against the shared db. We assert the exact statements and
// parameters fire (and in order), and that a query failure is wrapped with context — without a real db.
const organization = { id: "org_123", name: "Acme", slug: "acme" }

describe("provisionAppOrganization", () => {
  it("inserts the app organization row then a default entity, with the shared id", async () => {
    // Arrange
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const database = { query } as unknown as Pool

    // Act
    await provisionAppOrganization(database, organization)

    // Assert — organizations row first (id, name, slug), then the default entity for that org
    expect(query).toHaveBeenCalledTimes(2)
    expect(query.mock.calls[0]?.[0]).toContain('insert into "organizations"')
    expect(query.mock.calls[0]?.[1]).toEqual(["org_123", "Acme", "acme"])
    expect(query.mock.calls[1]?.[0]).toContain('insert into "entities"')
    expect(query.mock.calls[1]?.[1]).toEqual(["org_123"])
  })

  it("is safe to re-run: it relies on on-conflict / where-not-exists, never a pre-check", async () => {
    // Arrange — both inserts simply succeed; the idempotency lives in the SQL, so no read happens first
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const database = { query } as unknown as Pool

    // Act
    await provisionAppOrganization(database, organization)

    // Assert
    expect(query.mock.calls[0]?.[0]).toContain("on conflict (id) do nothing")
    expect(query.mock.calls[1]?.[0]).toContain("where not exists")
  })

  it("wraps a database failure with context", async () => {
    // Arrange
    const query = vi.fn().mockRejectedValue(new Error("connection reset"))
    const database = { query } as unknown as Pool

    // Act + Assert
    await expect(provisionAppOrganization(database, organization)).rejects.toThrow("Failed to provision the app organization: connection reset")
  })
})
