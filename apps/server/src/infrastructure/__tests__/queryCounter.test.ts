import { describe, expect, it } from "vitest"
import { currentQueryCount, recordQuery, withQueryCounter } from "../queryCounter"

describe("withQueryCounter", () => {
  it("counts the queries recorded inside the scope", async () => {
    // Arrange
    const operation = async () => {
      recordQuery()
      recordQuery()
      return "done"
    }

    // Act
    const { result, queryCount } = await withQueryCounter(operation)

    // Assert
    expect(result).toBe("done")
    expect(queryCount).toBe(2)
  })

  it("exposes the running count from within the scope", async () => {
    // Arrange + Act
    const { queryCount } = await withQueryCounter(async () => {
      recordQuery()
      return currentQueryCount()
    })

    // Assert — one query recorded, observed both inside and as the final total
    expect(queryCount).toBe(1)
  })

  it("isolates the count between independent scopes", async () => {
    // Arrange + Act
    const first = await withQueryCounter(async () => {
      recordQuery()
      return null
    })
    const second = await withQueryCounter(async () => null)

    // Assert
    expect(first.queryCount).toBe(1)
    expect(second.queryCount).toBe(0)
  })
})

describe("recordQuery and currentQueryCount outside a scope", () => {
  it("are no-ops with a zero count when no scope is active", () => {
    // Act — calling outside any scope must not throw
    recordQuery()

    // Assert
    expect(currentQueryCount()).toBe(0)
  })
})
