import { describe, expect, it } from "vitest"
import { renderSignature } from "../renderSignature"

const MINIMAL_TEMPLATE = "<mjml><mj-body><mj-section><mj-column><mj-text>{{ name }}</mj-text></mj-column></mj-section></mj-body></mjml>"

describe("renderSignature", () => {
  it("compiles a minimal MJML template into HTML containing the variable value", async () => {
    // Arrange
    const variables = { name: "Jane Doe" }

    // Act
    const renderedSignature = await renderSignature(MINIMAL_TEMPLATE, variables)

    // Assert
    expect(renderedSignature.html).toContain("<html")
    expect(renderedSignature.html).toContain("Jane Doe")
  })

  it("escapes the interpolated variable before MJML compilation", async () => {
    // Arrange
    const maliciousVariables = { name: "<b>boss</b>" }

    // Act
    const renderedSignature = await renderSignature(MINIMAL_TEMPLATE, maliciousVariables)

    // Assert
    expect(renderedSignature.html).toContain("&lt;b&gt;boss&lt;/b&gt;")
    expect(renderedSignature.html).not.toContain("<b>boss</b>")
  })

  it("throws a wrapped error when the MJML source is invalid", async () => {
    // Arrange
    const invalidSource = "<mjml><mj-body><not-a-real-tag>{{ name }}</not-a-real-tag></mj-body></mjml>"
    const variables = { name: "Jane" }

    // Act & Assert
    await expect(renderSignature(invalidSource, variables)).rejects.toThrow(/Failed to render signature/)
  })
})
