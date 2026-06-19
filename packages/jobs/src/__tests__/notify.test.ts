import { describe, expect, it, vi } from "vitest"
import { createNotifyHandler, NOTIFY_JOB, notifyPayloadSchema } from "../definitions/notify"

const validPayload = {
  channelType: "slack" as const,
  event: "synchronization.completed",
  message: "Sync run run-1 finished",
}

describe("notify job", () => {
  it("exposes the canonical pg-boss job name", () => {
    expect(NOTIFY_JOB).toBe("notify")
  })

  it("validates a well-formed payload", () => {
    expect(notifyPayloadSchema.parse(validPayload)).toEqual(validPayload)
  })

  it("dispatches the message to the configured channel", async () => {
    // Arrange
    const send = vi.fn().mockResolvedValue(undefined)
    const handler = createNotifyHandler({ send })

    // Act
    await handler(validPayload)

    // Assert
    expect(send).toHaveBeenCalledWith("slack", "synchronization.completed", "Sync run run-1 finished")
  })

  it("throws a validation error for an unsupported channel type before sending", async () => {
    // Arrange
    const send = vi.fn()
    const handler = createNotifyHandler({ send })

    // Act + Assert
    await expect(handler({ ...validPayload, channelType: "carrier-pigeon" } as never)).rejects.toThrow()
    expect(send).not.toHaveBeenCalled()
  })

  it("wraps a dispatch failure with event + channel context", async () => {
    // Arrange
    const send = vi.fn().mockRejectedValue(new Error("webhook 500"))
    const handler = createNotifyHandler({ send })

    // Act + Assert
    await expect(handler(validPayload)).rejects.toThrow("Failed to send synchronization.completed notification to slack channel: webhook 500")
  })
})
