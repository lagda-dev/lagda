import { describe, expect, it } from "vitest"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, fetchLimitFor, paginationQuerySchema, toPage } from "../pagination"

describe("paginationQuerySchema", () => {
  it("defaults the limit to the default page size when absent", () => {
    // Arrange + Act
    const parsed = paginationQuerySchema.parse({})

    // Assert
    expect(parsed.limit).toBe(DEFAULT_PAGE_SIZE)
    expect(parsed.cursor).toBeUndefined()
  })

  it("coerces a string limit and keeps the cursor", () => {
    // Arrange + Act
    const parsed = paginationQuerySchema.parse({ limit: "50", cursor: "abc" })

    // Assert
    expect(parsed.limit).toBe(50)
    expect(parsed.cursor).toBe("abc")
  })

  it("rejects a limit above the maximum page size", () => {
    // Arrange + Act + Assert
    expect(() => paginationQuerySchema.parse({ limit: String(MAX_PAGE_SIZE + 1) })).toThrow()
  })

  it("rejects a non-positive limit", () => {
    // Arrange + Act + Assert
    expect(() => paginationQuerySchema.parse({ limit: "0" })).toThrow()
  })
})

describe("fetchLimitFor", () => {
  it("asks for one extra row to detect the next page", () => {
    // Arrange + Act + Assert
    expect(fetchLimitFor(25)).toBe(26)
  })
})

describe("toPage", () => {
  const toCursor = (item: { id: string }) => item.id

  it("returns all rows and a null cursor when there is no extra row", () => {
    // Arrange
    const rows = [{ id: "1" }, { id: "2" }]

    // Act
    const page = toPage(rows, 25, toCursor)

    // Assert
    expect(page.data).toHaveLength(2)
    expect(page.nextCursor).toBeNull()
  })

  it("trims the extra row and derives nextCursor from the last kept item", () => {
    // Arrange — limit is 2, three rows means there is a next page
    const rows = [{ id: "1" }, { id: "2" }, { id: "3" }]

    // Act
    const page = toPage(rows, 2, toCursor)

    // Assert
    expect(page.data).toEqual([{ id: "1" }, { id: "2" }])
    expect(page.nextCursor).toBe("2")
  })

  it("returns an empty page with a null cursor for no rows", () => {
    // Arrange + Act
    const page = toPage([], 25, toCursor)

    // Assert
    expect(page.data).toEqual([])
    expect(page.nextCursor).toBeNull()
  })
})
