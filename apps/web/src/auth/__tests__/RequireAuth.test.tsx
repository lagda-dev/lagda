import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { RequireAuth } from "../RequireAuth"
import { useSession } from "../authClient"

// Mock the session hook so we can drive RequireAuth through its authenticated / unauthenticated states.
vi.mock("../authClient", () => ({
  useSession: vi.fn(),
}))

const mockedUseSession = vi.mocked(useSession)

const renderGuardedApp = () =>
  render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route path="/login" element={<p>Login screen</p>} />
        <Route element={<RequireAuth />}>
          <Route path="/protected" element={<p>Protected content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe("RequireAuth", () => {
  beforeEach(() => {
    mockedUseSession.mockReset()
  })

  it("redirects to /login when there is no session", () => {
    // Arrange
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as ReturnType<typeof useSession>)

    // Act
    renderGuardedApp()

    // Assert
    expect(screen.getByText("Login screen")).toBeInTheDocument()
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument()
  })

  it("renders the protected content when a session is present", () => {
    // Arrange
    mockedUseSession.mockReturnValue({ data: { user: { id: "u1" } }, isPending: false } as unknown as ReturnType<typeof useSession>)

    // Act
    renderGuardedApp()

    // Assert
    expect(screen.getByText("Protected content")).toBeInTheDocument()
  })
})
