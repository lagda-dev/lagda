import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { useTheme } from "../hooks/useTheme"

const mockPrefersDark = (prefersDark: boolean) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: prefersDark,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  )
}

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.removeItem("lagda-landing-theme")
    document.documentElement.classList.remove("dark")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test("defaults to the OS preference when nothing is stored", () => {
    // Arrange
    mockPrefersDark(true)

    // Act
    const { result } = renderHook(() => useTheme())

    // Assert
    expect(result.current.theme).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  test("a stored choice overrides the OS preference", () => {
    // Arrange
    mockPrefersDark(true)
    localStorage.setItem("lagda-landing-theme", "light")

    // Act
    const { result } = renderHook(() => useTheme())

    // Assert
    expect(result.current.theme).toBe("light")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  test("toggling flips the document class and persists the choice", () => {
    // Arrange
    mockPrefersDark(false)
    const { result } = renderHook(() => useTheme())

    // Act
    act(() => result.current.toggleTheme())

    // Assert
    expect(result.current.theme).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(localStorage.getItem("lagda-landing-theme")).toBe("dark")
  })
})
