import { describe, expect, it, vi } from "vitest"
import { createApp } from "../app"
import { bearer, buildDeps, createMockRepository, sampleAssignment, sampleEntity, sampleOrganization, sampleTemplate, verifierFor } from "./fixtures"

// The Wave-4 write routes (§4 REST): create/update/delete for templates and assignments, create/update
// for entities, and update for organizations. Each route is covered for its success path, a 400
// validation failure, and deny-by-default authorization (wrong role → 403). Driven against the mock
// repository so no live DB is involved; the data-layer tenant scoping is verified in integration.

const headers = { ...bearer(), "content-type": "application/json" }

type SendRequest = { app: ReturnType<typeof createApp>; path: string; method: string; body?: unknown }

const send = ({ app, path, method, body }: SendRequest) => app.request(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })

describe("POST /api/v1/templates", () => {
  it("creates a template and returns 201 with the record", async () => {
    // Arrange
    const repository = createMockRepository()
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/templates", method: "POST", body: { entityId: "ent-1", name: "Default", mjmlSource: "<mjml></mjml>" } })
    const body = (await response.json()) as typeof sampleTemplate

    // Assert
    expect(response.status).toBe(201)
    expect(body.id).toBe(sampleTemplate.id)
    expect(repository.createTemplate).toHaveBeenCalledWith({ orgId: "org-1", entityId: "ent-1", name: "Default", mjmlSource: "<mjml></mjml>" })
  })

  it("returns 404 when the referenced entity is not in the caller's org", async () => {
    // Arrange — the data layer reports a foreign entity as null
    const repository = createMockRepository()
    repository.createTemplate = vi.fn(async () => null)
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/templates", method: "POST", body: { entityId: "foreign", name: "Default", mjmlSource: "<mjml></mjml>" } })

    // Assert
    expect(response.status).toBe(404)
  })

  it("rejects a body missing mjmlSource with a 400 validation error", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act
    const response = await send({ app, path: "/api/v1/templates", method: "POST", body: { entityId: "ent-1", name: "Default" } })

    // Assert
    expect(response.status).toBe(400)
  })

  it("translates a persistence failure into a 500 envelope", async () => {
    // Arrange
    const repository = createMockRepository()
    repository.createTemplate = vi.fn(async () => Promise.reject(new Error("insert failed")))
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/templates", method: "POST", body: { entityId: "ent-1", name: "Default", mjmlSource: "<mjml></mjml>" } })

    // Assert
    expect(response.status).toBe(500)
  })

  it("denies a plain user with 403 (deny by default)", async () => {
    // Arrange
    const app = createApp(buildDeps({ verifyToken: verifierFor("user") }))

    // Act
    const response = await send({ app, path: "/api/v1/templates", method: "POST", body: { entityId: "ent-1", name: "Default", mjmlSource: "<mjml></mjml>" } })

    // Assert
    expect(response.status).toBe(403)
  })
})

describe("PATCH /api/v1/templates/{id}", () => {
  it("updates a template and returns 200 with the record", async () => {
    // Arrange
    const repository = createMockRepository()
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/templates/tpl-1", method: "PATCH", body: { name: "Renamed" } })

    // Assert
    expect(response.status).toBe(200)
    expect(repository.updateTemplate).toHaveBeenCalledWith({ orgId: "org-1", id: "tpl-1", name: "Renamed", mjmlSource: undefined })
  })

  it("returns 404 when the template is not in the caller's org", async () => {
    // Arrange — default mock for updateTemplate is overridden to null
    const repository = createMockRepository()
    repository.updateTemplate = vi.fn(async () => null)
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/templates/missing", method: "PATCH", body: { name: "Renamed" } })

    // Assert
    expect(response.status).toBe(404)
  })

  it("rejects an empty patch body with a 400 validation error", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act
    const response = await send({ app, path: "/api/v1/templates/tpl-1", method: "PATCH", body: {} })

    // Assert
    expect(response.status).toBe(400)
  })

  it("translates an update failure into a 500 envelope", async () => {
    // Arrange
    const repository = createMockRepository()
    repository.updateTemplate = vi.fn(async () => Promise.reject(new Error("update failed")))
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/templates/tpl-1", method: "PATCH", body: { name: "Renamed" } })

    // Assert
    expect(response.status).toBe(500)
  })

  it("denies a plain user with 403", async () => {
    // Arrange
    const app = createApp(buildDeps({ verifyToken: verifierFor("user") }))

    // Act
    const response = await send({ app, path: "/api/v1/templates/tpl-1", method: "PATCH", body: { name: "Renamed" } })

    // Assert
    expect(response.status).toBe(403)
  })
})

describe("DELETE /api/v1/templates/{id}", () => {
  it("deletes a template and returns 204 with no body", async () => {
    // Arrange
    const repository = createMockRepository()
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/templates/tpl-1", method: "DELETE" })

    // Assert
    expect(response.status).toBe(204)
    expect(await response.text()).toBe("")
    expect(repository.deleteTemplate).toHaveBeenCalledWith("org-1", "tpl-1")
  })

  it("returns 404 when nothing matched in the caller's org", async () => {
    // Arrange
    const repository = createMockRepository()
    repository.deleteTemplate = vi.fn(async () => false)
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/templates/missing", method: "DELETE" })

    // Assert
    expect(response.status).toBe(404)
  })

  it("translates a delete failure into a 500 envelope", async () => {
    // Arrange
    const repository = createMockRepository()
    repository.deleteTemplate = vi.fn(async () => Promise.reject(new Error("boom")))
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/templates/tpl-1", method: "DELETE" })

    // Assert
    expect(response.status).toBe(500)
  })

  it("denies a plain user with 403", async () => {
    // Arrange
    const app = createApp(buildDeps({ verifyToken: verifierFor("user") }))

    // Act
    const response = await send({ app, path: "/api/v1/templates/tpl-1", method: "DELETE" })

    // Assert
    expect(response.status).toBe(403)
  })
})

describe("POST /api/v1/assignments", () => {
  it("creates an assignment and returns 201 with the record", async () => {
    // Arrange
    const repository = createMockRepository()
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({
      app,
      path: "/api/v1/assignments",
      method: "POST",
      body: { entityId: "ent-1", templateId: "tpl-1", target: { kind: "entity" } },
    })
    const body = (await response.json()) as typeof sampleAssignment

    // Assert
    expect(response.status).toBe(201)
    expect(body.id).toBe(sampleAssignment.id)
    expect(repository.createAssignment).toHaveBeenCalledWith({ orgId: "org-1", entityId: "ent-1", templateId: "tpl-1", target: { kind: "entity" } })
  })

  it("returns 404 when the referenced template is not in the caller's org", async () => {
    // Arrange
    const repository = createMockRepository()
    repository.createAssignment = vi.fn(async () => null)
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/assignments", method: "POST", body: { entityId: "ent-1", templateId: "foreign", target: {} } })

    // Assert
    expect(response.status).toBe(404)
  })

  it("rejects a body missing templateId with a 400 validation error", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act
    const response = await send({ app, path: "/api/v1/assignments", method: "POST", body: { entityId: "ent-1", target: {} } })

    // Assert
    expect(response.status).toBe(400)
  })

  it("denies a plain user with 403", async () => {
    // Arrange
    const app = createApp(buildDeps({ verifyToken: verifierFor("user") }))

    // Act
    const response = await send({ app, path: "/api/v1/assignments", method: "POST", body: { entityId: "ent-1", templateId: "tpl-1", target: {} } })

    // Assert
    expect(response.status).toBe(403)
  })
})

describe("DELETE /api/v1/assignments/{id}", () => {
  it("deletes an assignment and returns 204", async () => {
    // Arrange
    const repository = createMockRepository()
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/assignments/asg-1", method: "DELETE" })

    // Assert
    expect(response.status).toBe(204)
    expect(repository.deleteAssignment).toHaveBeenCalledWith("org-1", "asg-1")
  })

  it("returns 404 when nothing matched", async () => {
    // Arrange
    const repository = createMockRepository()
    repository.deleteAssignment = vi.fn(async () => false)
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/assignments/missing", method: "DELETE" })

    // Assert
    expect(response.status).toBe(404)
  })

  it("denies a plain user with 403", async () => {
    // Arrange
    const app = createApp(buildDeps({ verifyToken: verifierFor("user") }))

    // Act
    const response = await send({ app, path: "/api/v1/assignments/asg-1", method: "DELETE" })

    // Assert
    expect(response.status).toBe(403)
  })
})

describe("POST /api/v1/entities", () => {
  it("creates an entity and returns 201 with the record", async () => {
    // Arrange
    const repository = createMockRepository()
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/entities", method: "POST", body: { name: "Brand", slug: "brand" } })
    const body = (await response.json()) as typeof sampleEntity

    // Assert
    expect(response.status).toBe(201)
    expect(body.id).toBe(sampleEntity.id)
    expect(repository.createEntity).toHaveBeenCalledWith({ orgId: "org-1", name: "Brand", slug: "brand" })
  })

  it("rejects a body missing slug with a 400 validation error", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act
    const response = await send({ app, path: "/api/v1/entities", method: "POST", body: { name: "Brand" } })

    // Assert
    expect(response.status).toBe(400)
  })

  it("denies an admin (entities are owner-only via MANAGE_ENTITIES) with 403", async () => {
    // Arrange — admin lacks MANAGE_ENTITIES
    const app = createApp(buildDeps({ verifyToken: verifierFor("admin") }))

    // Act
    const response = await send({ app, path: "/api/v1/entities", method: "POST", body: { name: "Brand", slug: "brand" } })

    // Assert
    expect(response.status).toBe(403)
  })
})

describe("PATCH /api/v1/entities/{id}", () => {
  it("updates an entity and returns 200", async () => {
    // Arrange
    const repository = createMockRepository()
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/entities/ent-1", method: "PATCH", body: { name: "Renamed" } })

    // Assert
    expect(response.status).toBe(200)
    expect(repository.updateEntity).toHaveBeenCalledWith({ orgId: "org-1", id: "ent-1", name: "Renamed", slug: undefined })
  })

  it("returns 404 when the entity is not in the caller's org", async () => {
    // Arrange
    const repository = createMockRepository()
    repository.updateEntity = vi.fn(async () => null)
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/entities/missing", method: "PATCH", body: { name: "Renamed" } })

    // Assert
    expect(response.status).toBe(404)
  })

  it("rejects an empty patch body with a 400 validation error", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act
    const response = await send({ app, path: "/api/v1/entities/ent-1", method: "PATCH", body: {} })

    // Assert
    expect(response.status).toBe(400)
  })

  it("denies an admin with 403", async () => {
    // Arrange
    const app = createApp(buildDeps({ verifyToken: verifierFor("admin") }))

    // Act
    const response = await send({ app, path: "/api/v1/entities/ent-1", method: "PATCH", body: { name: "Renamed" } })

    // Assert
    expect(response.status).toBe(403)
  })
})

describe("PATCH /api/v1/organizations/{id}", () => {
  it("updates the organization and returns 200", async () => {
    // Arrange
    const repository = createMockRepository()
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/organizations/org-1", method: "PATCH", body: { name: "New Name" } })
    const body = (await response.json()) as typeof sampleOrganization

    // Assert
    expect(response.status).toBe(200)
    expect(body.id).toBe(sampleOrganization.id)
    expect(repository.updateOrganization).toHaveBeenCalledWith({ orgId: "org-1", id: "org-1", name: "New Name" })
  })

  it("returns 404 when updating an organization other than the caller's own", async () => {
    // Arrange — the data layer rejects a foreign org id with null
    const repository = createMockRepository()
    repository.updateOrganization = vi.fn(async () => null)
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await send({ app, path: "/api/v1/organizations/other-org", method: "PATCH", body: { name: "New Name" } })

    // Assert
    expect(response.status).toBe(404)
  })

  it("rejects an empty patch body with a 400 validation error", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act
    const response = await send({ app, path: "/api/v1/organizations/org-1", method: "PATCH", body: {} })

    // Assert
    expect(response.status).toBe(400)
  })

  it("denies an admin (org management is owner-only via MANAGE_ORG) with 403", async () => {
    // Arrange
    const app = createApp(buildDeps({ verifyToken: verifierFor("admin") }))

    // Act
    const response = await send({ app, path: "/api/v1/organizations/org-1", method: "PATCH", body: { name: "New Name" } })

    // Assert
    expect(response.status).toBe(403)
  })
})
