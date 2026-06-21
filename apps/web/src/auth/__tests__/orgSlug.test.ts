import { describe, expect, it } from "vitest"
import { toOrgSlug } from "../orgSlug"

describe("toOrgSlug", () => {
  it("slugifies the name and appends the suffix", () => {
    expect(toOrgSlug("Acme Corp", "ab12")).toBe("acme-corp-ab12")
  })

  it("folds accents, collapses punctuation, and trims dashes", () => {
    expect(toOrgSlug("  Café & Co. !!", "x9")).toBe("cafe-co-x9")
  })

  it("falls back to an 'org' base when the name slugifies to nothing", () => {
    expect(toOrgSlug("!!!", "z0")).toBe("org-z0")
  })

  it("caps the base length so the slug stays reasonable", () => {
    const slug = toOrgSlug("a".repeat(100), "tail")
    expect(slug).toBe(`${"a".repeat(32)}-tail`)
  })
})
