import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ApplicationTokensPage } from "../ApplicationTokensPage"

// The resource hooks reach the API on import; stub them so the page renders in isolation.
vi.mock("../../api/resources/applicationTokens", () => ({
  useApplicationTokensList: () => ({ data: [], isPending: false, isError: false }),
  useMintApplicationToken: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRevokeApplicationToken: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

describe("ApplicationTokensPage", () => {
  it("renders the header and a generate action, with the empty state when there are no tokens", () => {
    // Arrange + Act
    render(<ApplicationTokensPage />)

    // Assert
    expect(screen.getByText("Application tokens")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Generate token" })).toBeInTheDocument()
    expect(screen.getByText("No application tokens yet")).toBeInTheDocument()
  })
})
