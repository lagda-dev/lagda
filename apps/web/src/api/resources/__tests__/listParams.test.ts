import { describe, expect, it } from "vitest"
import { toListFilters, toListQuery } from "../listParams"

describe("toListQuery", () => {
  it("omits absent cursor and limit", () => {
    expect(toListQuery({})).toEqual({})
  })

  it("serializes limit to a string and forwards a non-empty cursor", () => {
    expect(toListQuery({ cursor: "abc", limit: 50 })).toEqual({ cursor: "abc", limit: "50" })
  })
})

describe("toListFilters", () => {
  // Regression: the query key must include `limit`, not just `cursor` — otherwise two list views with
  // different page sizes collide on one cache entry and serve the wrong-sized page.
  it("folds BOTH cursor and limit into the filter object", () => {
    expect(toListFilters({ cursor: "abc", limit: 50 })).toEqual({ cursor: "abc", limit: 50 })
  })

  it("yields distinct filters for distinct limits (distinct cache keys)", () => {
    expect(toListFilters({ limit: 25 })).not.toEqual(toListFilters({ limit: 100 }))
  })
})
