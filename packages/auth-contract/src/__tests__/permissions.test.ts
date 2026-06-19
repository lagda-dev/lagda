import { describe, expect, it } from "vitest"
import { PERMISSIONS, ROLE_PERMISSIONS, TOKEN_SCOPES, hasPermission } from "../permissions"
import type { Permission } from "../permissions"

const ALL_PERMISSIONS: readonly Permission[] = Object.values(PERMISSIONS)

const ADMIN_ONLY_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.MANAGE_ORG,
  PERMISSIONS.MANAGE_ENTITIES,
  PERMISSIONS.MANAGE_MEMBERS,
  PERMISSIONS.MANAGE_TOKENS,
  PERMISSIONS.MANAGE_DIRECTORY,
]

const ADMIN_ALLOWED_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.MANAGE_TEMPLATES,
  PERMISSIONS.RUN_SYNCS,
  PERMISSIONS.READ_EMPLOYEES,
  PERMISSIONS.VIEW_OWN_SIGNATURE,
]

describe("hasPermission", () => {
  it("allows the owner to perform every permission", () => {
    // Arrange
    const ownerResults = ALL_PERMISSIONS.map((permission) => hasPermission("owner", permission))

    // Act
    const everyPermissionAllowed = ownerResults.every((allowed) => allowed === true)

    // Assert
    expect(everyPermissionAllowed).toBe(true)
  })

  it("grants the admin the templates, syncs, employee-read, and own-signature subset", () => {
    // Arrange & Act
    const adminAllowedResults = ADMIN_ALLOWED_PERMISSIONS.map((permission) => hasPermission("admin", permission))

    // Assert
    expect(adminAllowedResults.every((allowed) => allowed === true)).toBe(true)
  })

  it("denies the admin the owner-only management permissions", () => {
    // Arrange & Act
    const adminDeniedResults = ADMIN_ONLY_PERMISSIONS.map((permission) => hasPermission("admin", permission))

    // Assert
    expect(adminDeniedResults.every((allowed) => allowed === false)).toBe(true)
  })

  it("allows a plain user to view their own signature only", () => {
    // Arrange & Act
    const canViewOwnSignature = hasPermission("user", PERMISSIONS.VIEW_OWN_SIGNATURE)

    // Assert
    expect(canViewOwnSignature).toBe(true)
  })

  it("denies a plain user every admin action", () => {
    // Arrange
    const userAdminPermissions: readonly Permission[] = [...ADMIN_ONLY_PERMISSIONS, ...ADMIN_ALLOWED_PERMISSIONS].filter(
      (permission) => permission !== PERMISSIONS.VIEW_OWN_SIGNATURE,
    )

    // Act
    const userDeniedResults = userAdminPermissions.map((permission) => hasPermission("user", permission))

    // Assert
    expect(userDeniedResults.every((allowed) => allowed === false)).toBe(true)
  })
})

describe("ROLE_PERMISSIONS", () => {
  it("encodes the full permission set for the owner role", () => {
    // Arrange & Act
    const ownerPermissions = ROLE_PERMISSIONS.owner

    // Assert
    expect([...ownerPermissions].sort()).toEqual([...ALL_PERMISSIONS].sort())
  })

  it("grants the user role exactly one permission", () => {
    // Arrange & Act
    const userPermissions = ROLE_PERMISSIONS.user

    // Assert
    expect(userPermissions).toEqual([PERMISSIONS.VIEW_OWN_SIGNATURE])
  })
})

describe("TOKEN_SCOPES", () => {
  it("exposes the three machine-token scopes", () => {
    // Arrange & Act
    const scopes = [...TOKEN_SCOPES]

    // Assert
    expect(scopes).toEqual(["syncs:write", "syncs:read", "directory:read"])
  })
})
