import { expect, test } from "@playwright/test"

// The functional smoke: the app boots, serves the SPA, and an unauthenticated visitor lands on the
// sign-in page. This needs no seeded data or credentials, so it runs against any booted stack and
// guards the most basic "the deployable actually serves the UI" invariant.
test("an unauthenticated visitor reaches the sign-in page", async ({ page }) => {
  // Act — the app should redirect anything behind auth to /login.
  await page.goto("/login")

  // Assert — the sign-in surface renders.
  await expect(page.getByText("Sign in to Lagda")).toBeVisible()
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible()
})
