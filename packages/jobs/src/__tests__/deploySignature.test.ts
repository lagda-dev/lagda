import { describe, expect, it, vi } from "vitest"
import { createDeploySignatureHandler, DEPLOY_SIGNATURE_JOB, deploySignaturePayloadSchema } from "../definitions/deploySignature"

const validPayload = {
  employeeEmail: "alice@acme.test",
  html: "<table>signature</table>",
  syncRunId: "run-1",
}

describe("deploySignature job", () => {
  it("exposes the canonical pg-boss job name", () => {
    expect(DEPLOY_SIGNATURE_JOB).toBe("deploy-signature")
  })

  it("validates a well-formed payload", () => {
    expect(deploySignaturePayloadSchema.parse(validPayload)).toEqual(validPayload)
  })

  it("deploys the signature then records the deployment", async () => {
    // Arrange
    const deploySignature = vi.fn().mockResolvedValue(undefined)
    const recordDeployment = vi.fn().mockResolvedValue(undefined)
    const handler = createDeploySignatureHandler({ deploySignature, recordDeployment })

    // Act
    await handler(validPayload)

    // Assert
    expect(deploySignature).toHaveBeenCalledWith("alice@acme.test", "<table>signature</table>")
    expect(recordDeployment).toHaveBeenCalledWith({
      employeeEmail: "alice@acme.test",
      syncRunId: "run-1",
    })
  })

  it("throws a validation error for a malformed email before touching deps", async () => {
    // Arrange
    const deploySignature = vi.fn()
    const recordDeployment = vi.fn()
    const handler = createDeploySignatureHandler({ deploySignature, recordDeployment })

    // Act + Assert
    await expect(handler({ ...validPayload, employeeEmail: "not-an-email" } as never)).rejects.toThrow()
    expect(deploySignature).not.toHaveBeenCalled()
  })

  it("wraps a deploy failure with recipient + sync-run context and does not record", async () => {
    // Arrange
    const deploySignature = vi.fn().mockRejectedValue(new Error("mailbox locked"))
    const recordDeployment = vi.fn().mockResolvedValue(undefined)
    const handler = createDeploySignatureHandler({ deploySignature, recordDeployment })

    // Act + Assert
    await expect(handler(validPayload)).rejects.toThrow("Failed to deploy signature to alice@acme.test for sync run run-1: mailbox locked")
    expect(recordDeployment).not.toHaveBeenCalled()
  })
})
