import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// The directory page is driven entirely by the typed resource hooks, so we mock those three modules and
// assert the page renders rows from data and falls back to the empty state when there are none. The
// entity/department hooks are stubbed empty — the filters render but are not under test here.

const useEmployeesList = vi.fn()
const useEntitiesList = vi.fn()
const useDepartmentsList = vi.fn()

vi.mock("../../api/resources/employees", () => ({ useEmployeesList: () => useEmployeesList() }))
vi.mock("../../api/resources/entities", () => ({ useEntitiesList: () => useEntitiesList() }))
vi.mock("../../api/resources/departments", () => ({ useDepartmentsList: () => useDepartmentsList() }))

import { EmployeesPage } from "../EmployeesPage"

const idleList = { data: { data: [], nextCursor: null }, isPending: false, isError: false, isFetching: false }

describe("EmployeesPage", () => {
  beforeEach(() => {
    useEmployeesList.mockReset()
    useEntitiesList.mockReset()
    useDepartmentsList.mockReset()
    useEntitiesList.mockReturnValue(idleList)
    useDepartmentsList.mockReturnValue(idleList)
  })

  it("renders a row per employee from the mocked data", () => {
    // Arrange
    useEmployeesList.mockReturnValue({
      data: {
        data: [
          { id: "emp-1", entityId: "ent-1", email: "ada@example.com", firstName: "Ada", lastName: "Lovelace", department: "R&D", jobTitle: "Engineer" },
          { id: "emp-2", entityId: "ent-1", email: "alan@example.com", firstName: "Alan", lastName: "Turing", department: "R&D", jobTitle: "Researcher" },
        ],
        nextCursor: null,
      },
      isPending: false,
      isError: false,
      isFetching: false,
    })

    // Act
    render(<EmployeesPage />)

    // Assert
    expect(screen.getByText("ada@example.com")).toBeInTheDocument()
    expect(screen.getByText("alan@example.com")).toBeInTheDocument()
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument()
  })

  it("shows the empty state when there are no employees", () => {
    // Arrange
    useEmployeesList.mockReturnValue({ data: { data: [], nextCursor: null }, isPending: false, isError: false, isFetching: false })

    // Act
    render(<EmployeesPage />)

    // Assert
    expect(screen.getByText("No employees yet")).toBeInTheDocument()
  })

  it("shows the error state when the directory cannot be loaded", () => {
    // Arrange
    useEmployeesList.mockReturnValue({ data: undefined, isPending: false, isError: true, isFetching: false })

    // Act
    render(<EmployeesPage />)

    // Assert
    expect(screen.getByText("Unable to load employees")).toBeInTheDocument()
  })
})
