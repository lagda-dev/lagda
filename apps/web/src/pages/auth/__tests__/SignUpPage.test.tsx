import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { SignUpPage } from "../SignUpPage"

// The auth client reaches the auth service on import; stub the sign-up helpers so the page renders alone.
vi.mock("../../../auth/authClient", () => ({
  signUpWithEmail: vi.fn(),
  sendSignupOtp: vi.fn(),
  verifyEmailOtp: vi.fn(),
  signInWithPassword: vi.fn(),
  createOrganization: vi.fn(),
  setActiveOrganization: vi.fn(),
}))

describe("SignUpPage", () => {
  it("renders the account-details fields and a create button on the first step", () => {
    // Arrange + Act
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>,
    )

    // Assert
    expect(screen.getByLabelText("Your name")).toBeInTheDocument()
    expect(screen.getByLabelText("Company name")).toBeInTheDocument()
    expect(screen.getByLabelText("Work email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument()
  })

  it("offers a link back to sign-in", () => {
    // Arrange + Act
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>,
    )

    // Assert
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login")
  })
})
