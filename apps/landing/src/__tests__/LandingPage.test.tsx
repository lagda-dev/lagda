import { render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { LandingPage } from "../LandingPage"
import { APP_LOGIN_URL, APP_SIGNUP_URL, GITHUB_REPO_URL } from "../constants"

describe("LandingPage", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("dark")
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  })

  test("renders the hero headline", () => {
    // Arrange / Act
    render(<LandingPage />)

    // Assert
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("managed like infrastructure.")
  })

  test("renders every content section", () => {
    // Arrange / Act
    render(<LandingPage />)

    // Assert
    expect(screen.getByRole("heading", { name: "One source of truth for every signature" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Live in three steps" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Runs on your infrastructure. Your data never leaves." })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Built in the open" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Take control of your signatures." })).toBeInTheDocument()
  })

  test("CTAs point at login, signup and the GitHub repo", () => {
    // Arrange / Act
    render(<LandingPage />)

    // Assert
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", APP_LOGIN_URL)
    const signupLinks = screen.getAllByRole("link", { name: /get started/i })
    expect(signupLinks.length).toBeGreaterThan(0)
    for (const link of signupLinks) expect(link).toHaveAttribute("href", APP_SIGNUP_URL)
    expect(screen.getByRole("link", { name: /star on github/i })).toHaveAttribute("href", GITHUB_REPO_URL)
  })

  test("starts in light mode and offers a Dark toggle", () => {
    // Arrange / Act
    render(<LandingPage />)

    // Assert
    const nav = screen.getByRole("banner")
    expect(within(nav).getByRole("button", { name: "Dark" })).toBeInTheDocument()
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })
})
