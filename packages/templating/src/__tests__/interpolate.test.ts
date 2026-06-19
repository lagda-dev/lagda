import { describe, expect, it } from "vitest"
import { interpolate } from "../interpolate"

describe("interpolate", () => {
  it("replaces a placeholder with its escaped variable value", () => {
    // Arrange
    const template = "Hello {{ name }}, welcome."
    const variables = { name: "Jane" }

    // Act
    const interpolated = interpolate(template, variables)

    // Assert
    expect(interpolated).toBe("Hello Jane, welcome.")
  })

  it("tolerates arbitrary whitespace inside the braces", () => {
    // Arrange
    const template = "{{name}} and {{   role   }}"
    const variables = { name: "Jane", role: "CTO" }

    // Act
    const interpolated = interpolate(template, variables)

    // Assert
    expect(interpolated).toBe("Jane and CTO")
  })

  it("replaces a missing variable with an empty string", () => {
    // Arrange
    const template = "Hello {{ name }}{{ suffix }}!"
    const variables = { name: "Jane" }

    // Act
    const interpolated = interpolate(template, variables)

    // Assert
    expect(interpolated).toBe("Hello Jane!")
  })

  it("escapes variable values so HTML/script injection is neutralized", () => {
    // Arrange
    const template = "<p>{{ bio }}</p>"
    const maliciousVariables = { bio: '<script>alert("xss")</script>' }

    // Act
    const interpolated = interpolate(template, maliciousVariables)

    // Assert
    expect(interpolated).toBe("<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>")
  })

  it("leaves a template with no placeholders unchanged", () => {
    // Arrange
    const template = "No variables here."
    const variables = { name: "Jane" }

    // Act
    const interpolated = interpolate(template, variables)

    // Assert
    expect(interpolated).toBe("No variables here.")
  })
})
