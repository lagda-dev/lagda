import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// The hook layer is built on the typed `hc<AppType>` client (`../client`). We mock that single module so
// the fetchers and hooks can be exercised without a server, asserting (1) a list hook returns the
// `{ data, nextCursor }` envelope and (2) a mutation invalidates the right query key on success.

const employeesGet = vi.fn()
const synchronizationsPost = vi.fn()
const synchronizationsGet = vi.fn()

vi.mock("../client", () => ({
  api: {
    api: {
      v1: {
        employees: { $get: (...args: unknown[]) => employeesGet(...args) },
        synchronizations: {
          $get: (...args: unknown[]) => synchronizationsGet(...args),
          $post: (...args: unknown[]) => synchronizationsPost(...args),
        },
      },
    },
  },
}))

import { fetchEmployeesList } from "../resources/employees"
import { useCreateSynchronization, useSynchronizationsList } from "../resources/synchronizations"
import { ApiError } from "../fetchJson"

const okResponse = <Body,>(body: Body) => ({ ok: true, status: 200, json: async () => body })

const renderWithClient = (client: QueryClient) => {
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  return wrapper
}

describe("employees list fetcher", () => {
  beforeEach(() => {
    employeesGet.mockReset()
  })

  it("returns the { data, nextCursor } page envelope", async () => {
    // Arrange
    const page = {
      data: [{ id: "emp-1", entityId: "ent-1", email: "ada@example.com", firstName: "Ada", lastName: "Lovelace", department: "R&D", jobTitle: "Engineer" }],
      nextCursor: "next-1",
    }
    employeesGet.mockResolvedValue(okResponse(page))

    // Act
    const result = await fetchEmployeesList({})

    // Assert
    expect(result.data).toHaveLength(1)
    expect(result.data[0]?.email).toBe("ada@example.com")
    expect(result.nextCursor).toBe("next-1")
  })

  it("forwards entity and department filters and pagination into the query", async () => {
    // Arrange
    employeesGet.mockResolvedValue(okResponse({ data: [], nextCursor: null }))

    // Act
    await fetchEmployeesList({ cursor: "cur-9", limit: 50, entityId: "ent-7", department: "Sales" })

    // Assert
    expect(employeesGet).toHaveBeenCalledWith({ query: { cursor: "cur-9", limit: "50", entityId: "ent-7", department: "Sales" } })
  })

  it("throws an ApiError when the response is not ok", async () => {
    // Arrange
    employeesGet.mockResolvedValue({ ok: false, status: 403, json: async () => ({}) })

    // Act + Assert
    await expect(fetchEmployeesList({})).rejects.toBeInstanceOf(ApiError)
  })
})

describe("useSynchronizationsList", () => {
  beforeEach(() => {
    synchronizationsGet.mockReset()
  })

  it("exposes the page envelope through the query hook", async () => {
    // Arrange
    const page = {
      data: [{ id: "run-1", organizationId: "org-1", status: "succeeded", templateId: null, counts: {}, createdAt: "2026-01-01T00:00:00Z" }],
      nextCursor: null,
    }
    synchronizationsGet.mockResolvedValue(okResponse(page))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    // Act
    const { result } = renderHook(() => useSynchronizationsList(), { wrapper: renderWithClient(client) })

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data[0]?.id).toBe("run-1")
    expect(result.current.data?.nextCursor).toBeNull()
  })
})

describe("useCreateSynchronization", () => {
  beforeEach(() => {
    synchronizationsPost.mockReset()
  })

  it("invalidates the synchronizations query key after a successful run", async () => {
    // Arrange
    synchronizationsPost.mockResolvedValue({ ok: true, status: 202, json: async () => ({ id: "run-2", status: "pending" }) })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(client, "invalidateQueries")

    // Act
    const { result } = renderHook(() => useCreateSynchronization(), { wrapper: renderWithClient(client) })
    result.current.mutate({ target: { kind: "all" } } as never)

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["synchronizations"] })
  })
})
