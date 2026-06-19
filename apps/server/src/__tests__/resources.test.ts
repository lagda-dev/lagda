import { describe, expect, it, vi } from "vitest"
import { createApp } from "../app"
import type { Page } from "../infrastructure/pagination"
import { bearer, buildDeps, createMockRepository, verifierFor } from "./fixtures"
import type { EmployeeRecord } from "../repositories/types"

// Each resource: a list returns the `{ data, nextCursor }` envelope, a detail returns the item or a
// 404, and deny-by-default holds (no token → 401, wrong role → 403). Driven against the mock
// repository so no live DB is involved.

const headers = bearer()

describe("read resources — list returns the paginated envelope", () => {
  it("lists employees as { data, nextCursor }", async () => {
    // Arrange
    const repository = createMockRepository()
    const page: Page<EmployeeRecord> = {
      data: [{ id: "e1", entityId: "ent1", email: "a@b.com", firstName: "A", lastName: "B", department: "Eng", jobTitle: "Dev" }],
      nextCursor: "e1",
    }
    repository.listEmployees = vi.fn(async () => page)
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await app.request("/api/v1/employees?limit=1", { headers })
    const body = (await response.json()) as Page<EmployeeRecord>

    // Assert
    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.nextCursor).toBe("e1")
    expect(repository.listEmployees).toHaveBeenCalledWith("org-1", { limit: 1, cursor: undefined })
  })

  it("lists organizations, entities, templates, assignments, departments, roles and audit-events", async () => {
    // Arrange
    const app = createApp(buildDeps())
    const paths = [
      "/api/v1/organizations",
      "/api/v1/entities",
      "/api/v1/templates",
      "/api/v1/assignments",
      "/api/v1/departments",
      "/api/v1/roles",
      "/api/v1/audit-events",
    ]

    // Act
    const responses = await Promise.all(paths.map((path) => app.request(path, { headers })))

    // Assert — every list answers 200 with the envelope shape
    const bodies = await Promise.all(responses.map((response) => response.json() as Promise<Page<unknown>>))
    expect(responses.every((response) => response.status === 200)).toBe(true)
    expect(bodies.every((body) => Array.isArray(body.data) && "nextCursor" in body)).toBe(true)
  })
})

describe("detail reads", () => {
  it("returns the item when the repository finds it", async () => {
    // Arrange
    const repository = createMockRepository()
    repository.getOrganization = vi.fn(async () => ({ id: "org-1", name: "Acme", slug: "acme" }))
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await app.request("/api/v1/organizations/org-1", { headers })

    // Assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: "org-1", name: "Acme", slug: "acme" })
  })

  it("returns 404 with the error envelope when the repository finds nothing", async () => {
    // Arrange — mock default returns null
    const app = createApp(buildDeps())

    // Act
    const response = await app.request("/api/v1/templates/missing", { headers })
    const body = (await response.json()) as { error: { code: string } }

    // Assert
    expect(response.status).toBe(404)
    expect(body.error.code).toBe("not_found")
  })

  it("translates a repository failure into a 500 envelope", async () => {
    // Arrange
    const repository = createMockRepository()
    repository.getEntity = vi.fn(async () => Promise.reject(new Error("db down")))
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await app.request("/api/v1/entities/ent1", { headers })
    const body = (await response.json()) as { error: { code: string } }

    // Assert
    expect(response.status).toBe(500)
    expect(body.error.code).toBe("internal_error")
  })

  it("translates a list failure into a 500 envelope", async () => {
    // Arrange
    const repository = createMockRepository()
    repository.listRoles = vi.fn(async () => Promise.reject(new Error("boom")))
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await app.request("/api/v1/roles", { headers })

    // Assert
    expect(response.status).toBe(500)
  })
})

describe("deny by default", () => {
  it("rejects an unauthenticated request with 401", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act
    const response = await app.request("/api/v1/employees")

    // Assert
    expect(response.status).toBe(401)
  })

  it("rejects a plain user reaching an admin/owner resource with 403", async () => {
    // Arrange — a `user` may only view their own signature, not list employees
    const app = createApp(buildDeps({ verifyToken: verifierFor("user") }))

    // Act
    const response = await app.request("/api/v1/employees", { headers })

    // Assert
    expect(response.status).toBe(403)
  })

  it("lets an admin read employees but not manage the org", async () => {
    // Arrange
    const app = createApp(buildDeps({ verifyToken: verifierFor("admin") }))

    // Act
    const employees = await app.request("/api/v1/employees", { headers })
    const organizations = await app.request("/api/v1/organizations", { headers })

    // Assert
    expect(employees.status).toBe(200)
    expect(organizations.status).toBe(403)
  })

  it("rejects a bad limit with a 400 validation error", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act
    const response = await app.request("/api/v1/employees?limit=9999", { headers })

    // Assert
    expect(response.status).toBe(400)
  })
})
