import { argosScreenshot } from "@argos-ci/playwright"
import { test } from "@playwright/test"

// Argos visual regression: capture the sign-in page so unintended UI changes surface as image diffs in
// the PR. `argosScreenshot` writes a stabilised screenshot; the visual.yml workflow uploads the set to
// Argos (gated on ARGOS_TOKEN). Without the token the screenshot is still taken locally and simply not
// uploaded, so the spec stays runnable everywhere.
test("sign-in page visual snapshot", async ({ page }) => {
  await page.goto("/login")
  await page.getByText("Sign in to Lagda").waitFor()
  await argosScreenshot(page, "login")
})
