import { describe, expect, it, vi } from "vitest"
import { createSyncDirectoryHandler, SYNC_DIRECTORY_JOB, syncDirectoryPayloadSchema } from "../definitions/syncDirectory"

const validPayload = { organizationId: "org-1", entityId: "entity-1", syncRunId: "run-1" }

describe("syncDirectory job", () => {
  it("exposes the canonical pg-boss job name", () => {
    expect(SYNC_DIRECTORY_JOB).toBe("sync-directory")
  })

  it("validates a well-formed payload", () => {
    expect(syncDirectoryPayloadSchema.parse(validPayload)).toEqual(validPayload)
  })

  it("enqueues one deploy job per listed employee with the sync run id", async () => {
    // Arrange
    const listEmployees = vi.fn().mockResolvedValue([{ email: "alice@acme.test" }, { email: "bob@acme.test" }])
    const enqueueDeploy = vi.fn().mockResolvedValue(undefined)
    const handler = createSyncDirectoryHandler({ listEmployees, enqueueDeploy })

    // Act
    await handler(validPayload)

    // Assert
    expect(listEmployees).toHaveBeenCalledWith("org-1", "entity-1")
    expect(enqueueDeploy).toHaveBeenCalledTimes(2)
    expect(enqueueDeploy).toHaveBeenCalledWith({
      employeeEmail: "alice@acme.test",
      syncRunId: "run-1",
    })
    expect(enqueueDeploy).toHaveBeenCalledWith({
      employeeEmail: "bob@acme.test",
      syncRunId: "run-1",
    })
  })

  it("enqueues nothing when the directory is empty", async () => {
    // Arrange
    const listEmployees = vi.fn().mockResolvedValue([])
    const enqueueDeploy = vi.fn().mockResolvedValue(undefined)
    const handler = createSyncDirectoryHandler({ listEmployees, enqueueDeploy })

    // Act
    await handler(validPayload)

    // Assert
    expect(enqueueDeploy).not.toHaveBeenCalled()
  })

  it("throws a validation error for an invalid payload before touching deps", async () => {
    // Arrange
    const listEmployees = vi.fn()
    const enqueueDeploy = vi.fn()
    const handler = createSyncDirectoryHandler({ listEmployees, enqueueDeploy })

    // Act + Assert
    await expect(handler({ organizationId: "", entityId: "entity-1", syncRunId: "run-1" } as never)).rejects.toThrow()
    expect(listEmployees).not.toHaveBeenCalled()
  })

  it("wraps a failure from enqueueDeploy with sync-run context", async () => {
    // Arrange
    const listEmployees = vi.fn().mockResolvedValue([{ email: "alice@acme.test" }])
    const enqueueDeploy = vi.fn().mockRejectedValue(new Error("queue down"))
    const handler = createSyncDirectoryHandler({ listEmployees, enqueueDeploy })

    // Act + Assert
    await expect(handler(validPayload)).rejects.toThrow("Failed to enqueue deploy jobs for sync run run-1: queue down")
  })
})
