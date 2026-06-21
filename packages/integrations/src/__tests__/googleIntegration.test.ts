import { describe, expect, it, vi } from "vitest"
import { createGoogleIntegration } from "../google/googleIntegration"
import type { GoogleClient } from "../google/googleClient"
import type { GoogleDirectoryUser } from "../mappers/googleUserMapper"

const buildMockClient = (overrides: Partial<GoogleClient> = {}): GoogleClient => ({
  listDirectoryUsers: vi.fn(async () => []),
  updateSendAsSignature: vi.fn(async () => undefined),
  ...overrides,
})

describe("createGoogleIntegration", () => {
  describe("listEmployees", () => {
    it("maps directory users returned by the client to domain employees", async () => {
      // Arrange
      const directoryUsers: GoogleDirectoryUser[] = [
        {
          primaryEmail: "ada@example.com",
          name: { givenName: "Ada", familyName: "Lovelace" },
          organizations: [{ department: "Engineering", title: "Principal Engineer" }],
        },
      ]
      const client = buildMockClient({ listDirectoryUsers: vi.fn(async () => directoryUsers) })
      const integration = createGoogleIntegration(client)

      // Act
      const employees = await integration.listEmployees()

      // Assert
      expect(client.listDirectoryUsers).toHaveBeenCalledOnce()
      expect(employees).toEqual([
        {
          email: "ada@example.com",
          firstName: "Ada",
          lastName: "Lovelace",
          department: "Engineering",
          jobTitle: "Principal Engineer",
        },
      ])
    })

    it("wraps client errors with integration context", async () => {
      // Arrange
      const client = buildMockClient({
        listDirectoryUsers: vi.fn(async () => {
          throw new Error("quota exceeded")
        }),
      })
      const integration = createGoogleIntegration(client)

      // Act + Assert
      await expect(integration.listEmployees()).rejects.toThrow("Failed to list employees from Google Workspace: quota exceeded")
    })
  })

  describe("deploySignature", () => {
    it("forwards the email and html to the client", async () => {
      // Arrange
      const client = buildMockClient()
      const integration = createGoogleIntegration(client)

      // Act
      await integration.deploySignature("ada@example.com", "<p>Ada</p>")

      // Assert
      expect(client.updateSendAsSignature).toHaveBeenCalledWith("ada@example.com", "<p>Ada</p>")
    })

    it("wraps client errors with the target email in context", async () => {
      // Arrange
      const client = buildMockClient({
        updateSendAsSignature: vi.fn(async () => {
          throw new Error("permission denied")
        }),
      })
      const integration = createGoogleIntegration(client)

      // Act + Assert
      await expect(integration.deploySignature("ada@example.com", "<p>Ada</p>")).rejects.toThrow(
        "Failed to deploy signature to ada@example.com via Google Workspace: permission denied",
      )
    })
  })
})
