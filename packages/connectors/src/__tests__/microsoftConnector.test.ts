import { describe, expect, it } from "vitest"
import { createMicrosoftConnector } from "../microsoft/microsoftConnector"

const NOT_IMPLEMENTED_MESSAGE = "NotImplemented: Microsoft connector is not available yet"

describe("createMicrosoftConnector", () => {
  it("throws NotImplemented from listEmployees", async () => {
    // Arrange
    const connector = createMicrosoftConnector()

    // Act + Assert
    await expect(connector.listEmployees()).rejects.toThrow(NOT_IMPLEMENTED_MESSAGE)
  })

  it("throws NotImplemented from deploySignature", async () => {
    // Arrange
    const connector = createMicrosoftConnector()

    // Act + Assert
    await expect(connector.deploySignature("ada@example.com", "<p>Ada</p>")).rejects.toThrow(NOT_IMPLEMENTED_MESSAGE)
  })
})
