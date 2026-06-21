import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { LoginPage } from "../LoginPage"

// The auth client reaches out to the auth service on import; stub it so the page renders in isolation.
vi.mock("../../../auth/authClient", () => ({
  signIn: { email: vi.fn() },
  sendOtp: vi.fn(),
}))

describe("LoginPage", () => {
  it("renders the email and password fields and a submit button", () => {
    // Arrange + Act
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    // Assert
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument()
  })
})
