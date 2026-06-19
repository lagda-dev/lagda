import { describe, expect, it } from "vitest"
import { escapeHtml } from "../escapeHtml"

describe("escapeHtml", () => {
  it("escapes the ampersand", () => {
    // Arrange
    const rawValue = "Tom & Jerry"

    // Act
    const escapedValue = escapeHtml(rawValue)

    // Assert
    expect(escapedValue).toBe("Tom &amp; Jerry")
  })

  it("escapes the less-than sign", () => {
    // Arrange
    const rawValue = "a < b"

    // Act
    const escapedValue = escapeHtml(rawValue)

    // Assert
    expect(escapedValue).toBe("a &lt; b")
  })

  it("escapes the greater-than sign", () => {
    // Arrange
    const rawValue = "b > a"

    // Act
    const escapedValue = escapeHtml(rawValue)

    // Assert
    expect(escapedValue).toBe("b &gt; a")
  })

  it("escapes the double quote", () => {
    // Arrange
    const rawValue = 'say "hello"'

    // Act
    const escapedValue = escapeHtml(rawValue)

    // Assert
    expect(escapedValue).toBe("say &quot;hello&quot;")
  })

  it("escapes the single quote", () => {
    // Arrange
    const rawValue = "it's mine"

    // Act
    const escapedValue = escapeHtml(rawValue)

    // Assert
    expect(escapedValue).toBe("it&#39;s mine")
  })

  it("leaves a string with no significant characters unchanged", () => {
    // Arrange
    const rawValue = "Jane Doe"

    // Act
    const escapedValue = escapeHtml(rawValue)

    // Assert
    expect(escapedValue).toBe("Jane Doe")
  })
})
