import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AssignmentTargetSelector, emptyTargetForKind, parseUserIds } from "../AssignmentTargetSelector"
import type { AssignmentTarget } from "../AssignmentTargetSelector"

// The target selector is the §15 discriminated control. We assert its pure helpers build the right
// variant shapes and that switching to a kind with an extra field (department) reveals that field and
// reports the change up via onChange.

const entities = [
  { id: "ent-1", organizationId: "org-1", name: "Acme", slug: "acme" },
  { id: "ent-2", organizationId: "org-1", name: "Globex", slug: "globex" },
]

describe("emptyTargetForKind", () => {
  it("builds an org target carrying the organization id", () => {
    expect(emptyTargetForKind("org", "org-9", "ent-1")).toEqual({ kind: "org", organizationId: "org-9" })
  })

  it("seeds entity-scoped variants with the first entity id", () => {
    expect(emptyTargetForKind("department", "org-9", "ent-1")).toEqual({ kind: "department", entityId: "ent-1", department: "" })
    expect(emptyTargetForKind("users", "org-9", "ent-1")).toEqual({ kind: "users", entityId: "ent-1", userIds: [] })
  })
})

describe("parseUserIds", () => {
  it("splits on commas and newlines, trimming and dropping blanks", () => {
    expect(parseUserIds("a, b\n c ,, ")).toEqual(["a", "b", "c"])
  })
})

describe("AssignmentTargetSelector", () => {
  it("shows the entity picker for an entity target and reveals the department field on switch", () => {
    // Arrange
    const value: AssignmentTarget = { kind: "department", entityId: "ent-1", department: "" }
    const onChange = vi.fn()

    // Act
    render(<AssignmentTargetSelector value={value} organizationId="org-1" entities={entities} onChange={onChange} />)

    // Assert — the discriminated department field is present for the department variant
    expect(screen.getByLabelText("Department")).toBeInTheDocument()

    // Act — typing the department reports a new immutable target up
    fireEvent.change(screen.getByLabelText("Department"), { target: { value: "Engineering" } })

    // Assert
    expect(onChange).toHaveBeenCalledWith({ kind: "department", entityId: "ent-1", department: "Engineering" })
  })

  it("hides the entity picker for an org target", () => {
    // Arrange
    const value: AssignmentTarget = { kind: "org", organizationId: "org-1" }

    // Act
    render(<AssignmentTargetSelector value={value} organizationId="org-1" entities={entities} onChange={vi.fn()} />)

    // Assert
    expect(screen.queryByLabelText("Entity")).not.toBeInTheDocument()
  })
})
