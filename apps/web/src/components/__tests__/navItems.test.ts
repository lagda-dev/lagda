import { describe, expect, it } from "vitest"
import { navItemsForRole } from "../navItems"

// Role-based nav filtering is a pure function of the §6 permission matrix, so it is tested without React.
// The catalogue currently lists only the screens that have routes; more are added as their pages land.
describe("navItemsForRole", () => {
  it("gives the owner every built navigation item including owner-only areas", () => {
    // Arrange
    const role = "owner"

    // Act
    const labels = navItemsForRole(role).map((item) => item.label)

    // Assert
    expect(labels).toEqual([
      "Dashboard",
      "Templates",
      "Assignments",
      "Synchronizations",
      "Employees",
      "Entities",
      "Application tokens",
      "Audit events",
      "Settings",
    ])
  })

  it("restricts a user to the surfaces their role unlocks", () => {
    // Arrange
    const role = "user"

    // Act
    const labels = navItemsForRole(role).map((item) => item.label)

    // Assert — only the dashboard is gated by VIEW_OWN_SIGNATURE today
    expect(labels).toEqual(["Dashboard"])
    expect(labels).not.toContain("Settings")
    expect(labels).not.toContain("Templates")
    expect(labels).not.toContain("Application tokens")
  })

  it("gives admin templates/assignments/employees but not owner-only areas", () => {
    // Arrange
    const role = "admin"

    // Act
    const labels = navItemsForRole(role).map((item) => item.label)

    // Assert
    expect(labels).toContain("Templates")
    expect(labels).toContain("Assignments")
    expect(labels).toContain("Synchronizations")
    expect(labels).toContain("Employees")
    expect(labels).toContain("Application tokens")
    expect(labels).not.toContain("Settings")
    expect(labels).not.toContain("Entities")
  })
})
