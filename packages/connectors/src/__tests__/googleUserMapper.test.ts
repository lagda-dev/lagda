import { describe, expect, it } from "vitest"
import { toDirectoryEmployee, type GoogleDirectoryUser } from "../mappers/googleUserMapper"

describe("toDirectoryEmployee", () => {
  it("maps a fully populated directory user to a domain employee", () => {
    // Arrange
    const rawUser: GoogleDirectoryUser = {
      primaryEmail: "ada@example.com",
      name: { givenName: "Ada", familyName: "Lovelace" },
      organizations: [{ department: "Engineering", title: "Principal Engineer" }],
    }

    // Act
    const employee = toDirectoryEmployee(rawUser)

    // Assert
    expect(employee).toEqual({
      email: "ada@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      department: "Engineering",
      jobTitle: "Principal Engineer",
    })
  })

  it("returns null department and jobTitle when no organization is present", () => {
    // Arrange
    const rawUser: GoogleDirectoryUser = {
      primaryEmail: "grace@example.com",
      name: { givenName: "Grace", familyName: "Hopper" },
    }

    // Act
    const employee = toDirectoryEmployee(rawUser)

    // Assert
    expect(employee.department).toBeNull()
    expect(employee.jobTitle).toBeNull()
  })

  it("returns null department and jobTitle when organization fields are missing", () => {
    // Arrange
    const rawUser: GoogleDirectoryUser = {
      primaryEmail: "alan@example.com",
      name: { givenName: "Alan", familyName: "Turing" },
      organizations: [{}],
    }

    // Act
    const employee = toDirectoryEmployee(rawUser)

    // Assert
    expect(employee.department).toBeNull()
    expect(employee.jobTitle).toBeNull()
  })

  it("falls back to empty strings when name fields are absent", () => {
    // Arrange
    const rawUser: GoogleDirectoryUser = {
      primaryEmail: "anon@example.com",
      name: null,
      organizations: null,
    }

    // Act
    const employee = toDirectoryEmployee(rawUser)

    // Assert
    expect(employee.firstName).toBe("")
    expect(employee.lastName).toBe("")
  })
})
