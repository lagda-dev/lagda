import { describe, expect, it } from "vitest"
import { navItemsForRole } from "../navItems"

// Role-based nav filtering is a pure function of the §6 permission matrix, so it is tested without React.
describe("navItemsForRole", () => {
  it("gives the owner every navigation item including owner-only areas", () => {
    // Arrange
    const role = "owner"

    // Act
    const labels = navItemsForRole(role).map((item) => item.label)

    // Assert
    expect(labels).toContain("Settings")
    expect(labels).toContain("Members")
    expect(labels).toContain("Entities")
    expect(labels).toContain("Tokens")
    expect(labels).toContain("Directory")
    expect(labels).toContain("Templates")
  })

  it("restricts a user to their own signature surfaces", () => {
    // Arrange
    const role = "user"

    // Act
    const labels = navItemsForRole(role).map((item) => item.label)

    // Assert
    expect(labels).toEqual(["Dashboard", "My signature"])
    expect(labels).not.toContain("Settings")
    expect(labels).not.toContain("Templates")
  })

  it("gives admin templates and syncs but not owner-only org settings", () => {
    // Arrange
    const role = "admin"

    // Act
    const labels = navItemsForRole(role).map((item) => item.label)

    // Assert
    expect(labels).toContain("Templates")
    expect(labels).toContain("Synchronizations")
    expect(labels).toContain("Employees")
    expect(labels).not.toContain("Settings")
    expect(labels).not.toContain("Members")
  })
})
