import { describe, expect, it, vi } from "vitest"
import { createApp } from "../app"
import type { Page } from "../infrastructure/pagination"
import { bearer, buildDeps, createMockEnqueuer, createMockRepository, sampleSyncRun, verifierFor } from "./fixtures"
import type { DeploymentRecord, SyncRunRecord } from "../repositories/types"

// The richest resource: POST creates a sync_run, enqueues the directory deploy job, and returns 202;
// GET reads status; GET /{id}/deployments paginates; POST /{id}/cancel cancels. Scopes and roles are
// enforced deny-by-default.

const headers = { ...bearer(), "content-type": "application/json" }

const postSync = (app: ReturnType<typeof createApp>, body: unknown) =>
  app.request("/api/v1/synchronizations", { method: "POST", headers, body: JSON.stringify(body) })

describe("POST /api/v1/synchronizations", () => {
  it("persists a sync_run, enqueues the directory sync, and returns 202 with the id", async () => {
    // Arrange
    const repository = createMockRepository()
    const enqueuer = createMockEnqueuer()
    const app = createApp(buildDeps({ repository, enqueuer }))

    // Act
    const response = await postSync(app, { target: { kind: "entity", entityId: "ent-1" } })
    const body = (await response.json()) as { id: string; status: string }

    // Assert
    expect(response.status).toBe(202)
    expect(body.id).toBe(sampleSyncRun.id)
    expect(repository.createSyncRun).toHaveBeenCalledWith({
      organizationId: "org-1",
      target: { kind: "entity", entityId: "ent-1" },
      templateId: null,
      createdBy: "user-1",
    })
    expect(enqueuer.enqueueDirectorySync).toHaveBeenCalledWith({ organizationId: "org-1", entityId: "ent-1", syncRunId: sampleSyncRun.id })
  })

  it("accepts the org target variant and enqueues against the organization", async () => {
    // Arrange
    const enqueuer = createMockEnqueuer()
    const app = createApp(buildDeps({ enqueuer }))

    // Act
    const response = await postSync(app, { target: { kind: "org", organizationId: "org-1" }, templateId: "tpl-1" })

    // Assert
    expect(response.status).toBe(202)
    expect(enqueuer.enqueueDirectorySync).toHaveBeenCalledWith({ organizationId: "org-1", entityId: "org-1", syncRunId: sampleSyncRun.id })
  })

  it("accepts the users target variant", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act
    const response = await postSync(app, { target: { kind: "users", entityId: "ent-1", userIds: ["u1", "u2"] } })

    // Assert
    expect(response.status).toBe(202)
  })

  it("rejects an invalid target with a 400 validation error", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act — `kind` is not part of the discriminated union
    const response = await postSync(app, { target: { kind: "galaxy" } })

    // Assert
    expect(response.status).toBe(400)
  })

  it("rejects a users target with an empty userIds list", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act
    const response = await postSync(app, { target: { kind: "users", entityId: "ent-1", userIds: [] } })

    // Assert
    expect(response.status).toBe(400)
  })

  it("translates a persistence failure into a 500 envelope", async () => {
    // Arrange
    const repository = createMockRepository()
    repository.createSyncRun = vi.fn(async () => Promise.reject(new Error("insert failed")))
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await postSync(app, { target: { kind: "entity", entityId: "ent-1" } })

    // Assert
    expect(response.status).toBe(500)
  })

  it("denies a plain user with 403 (deny by default)", async () => {
    // Arrange
    const app = createApp(buildDeps({ verifyToken: verifierFor("user") }))

    // Act
    const response = await postSync(app, { target: { kind: "entity", entityId: "ent-1" } })

    // Assert
    expect(response.status).toBe(403)
  })

  it("denies a token missing the syncs:write scope with 403", async () => {
    // Arrange — owner role but a token scoped only to reads
    const verifyToken = vi.fn(async () => ({ sub: "user-1", orgId: "org-1", role: "owner", scopes: ["syncs:read"] }))
    const app = createApp(buildDeps({ verifyToken }))

    // Act
    const response = await postSync(app, { target: { kind: "entity", entityId: "ent-1" } })

    // Assert
    expect(response.status).toBe(403)
  })
})

describe("GET /api/v1/synchronizations/{id}", () => {
  it("returns the sync run status", async () => {
    // Arrange
    const repository = createMockRepository()
    const run: SyncRunRecord = { ...sampleSyncRun, status: "running" }
    repository.getSyncRun = vi.fn(async () => run)
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await app.request("/api/v1/synchronizations/sync-1", { headers: bearer() })
    const body = (await response.json()) as SyncRunRecord

    // Assert
    expect(response.status).toBe(200)
    expect(body.status).toBe("running")
  })

  it("returns 404 when the run does not exist", async () => {
    // Arrange — default mock returns null
    const app = createApp(buildDeps())

    // Act
    const response = await app.request("/api/v1/synchronizations/missing", { headers: bearer() })

    // Assert
    expect(response.status).toBe(404)
  })
})

describe("GET /api/v1/synchronizations/{id}/deployments", () => {
  it("returns a paginated page of deployments", async () => {
    // Arrange
    const repository = createMockRepository()
    const page: Page<DeploymentRecord> = {
      data: [{ id: "d1", syncRunId: "sync-1", employeeId: "e1", status: "succeeded", error: null }],
      nextCursor: null,
    }
    repository.listDeployments = vi.fn(async () => page)
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await app.request("/api/v1/synchronizations/sync-1/deployments", { headers: bearer() })
    const body = (await response.json()) as Page<DeploymentRecord>

    // Assert
    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(repository.listDeployments).toHaveBeenCalledWith("org-1", "sync-1", { limit: 25, cursor: undefined })
  })

  it("translates a deployments failure into a 500 envelope", async () => {
    // Arrange
    const repository = createMockRepository()
    repository.listDeployments = vi.fn(async () => Promise.reject(new Error("boom")))
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await app.request("/api/v1/synchronizations/sync-1/deployments", { headers: bearer() })

    // Assert
    expect(response.status).toBe(500)
  })
})

describe("POST /api/v1/synchronizations/{id}/cancel", () => {
  it("cancels the run and returns it", async () => {
    // Arrange
    const repository = createMockRepository()
    const cancelled: SyncRunRecord = { ...sampleSyncRun, status: "cancelled" }
    repository.cancelSyncRun = vi.fn(async () => cancelled)
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await app.request("/api/v1/synchronizations/sync-1/cancel", { method: "POST", headers })
    const body = (await response.json()) as SyncRunRecord

    // Assert
    expect(response.status).toBe(200)
    expect(body.status).toBe("cancelled")
    expect(repository.cancelSyncRun).toHaveBeenCalledWith("org-1", "sync-1")
  })

  it("returns 404 when cancelling a run that does not exist", async () => {
    // Arrange — the run is not found, so cancel resolves null
    const repository = createMockRepository()
    repository.cancelSyncRun = vi.fn(async () => null)
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await app.request("/api/v1/synchronizations/missing/cancel", { method: "POST", headers })

    // Assert
    expect(response.status).toBe(404)
  })
})

describe("GET /api/v1/synchronizations (list)", () => {
  it("lists sync runs as a paginated envelope", async () => {
    // Arrange
    const repository = createMockRepository()
    repository.listSyncRuns = vi.fn(async () => ({ data: [sampleSyncRun], nextCursor: null }))
    const app = createApp(buildDeps({ repository }))

    // Act
    const response = await app.request("/api/v1/synchronizations", { headers: bearer() })
    const body = (await response.json()) as Page<SyncRunRecord>

    // Assert
    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(1)
  })

  it("requires only the read scope to list", async () => {
    // Arrange — a read-only token can list but not create
    const verifyToken = vi.fn(async () => ({ sub: "user-1", orgId: "org-1", role: "admin", scopes: ["syncs:read"] }))
    const app = createApp(buildDeps({ verifyToken }))

    // Act
    const response = await app.request("/api/v1/synchronizations", { headers: bearer() })

    // Assert
    expect(response.status).toBe(200)
  })
})
