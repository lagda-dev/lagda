import { describe, expect, it } from "vitest"
import { createMicrosoftIntegration } from "../microsoft/microsoftIntegration"

const NOT_IMPLEMENTED_MESSAGE = "NotImplemented: Microsoft integration is not available yet"

describe("createMicrosoftIntegration", () => {
  it("throws NotImplemented from listEmployees", async () => {
    // Arrange
    const integration = createMicrosoftIntegration()

    // Act + Assert
    await expect(integration.listEmployees()).rejects.toThrow(NOT_IMPLEMENTED_MESSAGE)
  })

  it("throws NotImplemented from deploySignature", async () => {
    // Arrange
    const integration = createMicrosoftIntegration()

    // Act + Assert
    await expect(integration.deploySignature("ada@example.com", "<p>Ada</p>")).rejects.toThrow(NOT_IMPLEMENTED_MESSAGE)
  })
})
