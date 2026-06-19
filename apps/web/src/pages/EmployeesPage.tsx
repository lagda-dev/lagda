import { Button, DataTable, EmptyState, PageHeader, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@lagda/ui"
import type { DataTableColumn } from "@lagda/ui"
import { useState } from "react"
import { useDepartmentsList } from "../api/resources/departments"
import { useEntitiesList } from "../api/resources/entities"
import { useEmployeesList } from "../api/resources/employees"
import type { Employee } from "../api/resources/employees"

// The directory screen: a read-only table of synced employees (READ_EMPLOYEES), filterable by entity
// and/or department, with cursor "load more" pagination. Data comes from the typed TanStack Query hooks;
// the page itself holds only view state (the active filters and the accumulated rows).

// A sentinel for "no filter" — Radix Select needs a non-empty item value, so the empty selection maps
// to this constant rather than to "".
const ALL_OPTION = "all"

const fullName = ({ firstName, lastName }: Employee): string => {
  const parts = [firstName, lastName].filter((part): part is string => part !== null && part.length > 0)
  return parts.length > 0 ? parts.join(" ") : "—"
}

const orDash = (value: string | null): string => (value !== null && value.length > 0 ? value : "—")

const employeeColumns: DataTableColumn<Employee>[] = [
  { header: "Email", cell: (employee) => employee.email },
  { header: "Name", cell: (employee) => fullName(employee) },
  { header: "Department", cell: (employee) => orDash(employee.department) },
  { header: "Job title", cell: (employee) => orDash(employee.jobTitle) },
]

const toFilterValue = (selection: string): string | undefined => (selection === ALL_OPTION ? undefined : selection)

export const EmployeesPage = () => {
  const [entitySelection, setEntitySelection] = useState<string>(ALL_OPTION)
  const [departmentSelection, setDepartmentSelection] = useState<string>(ALL_OPTION)
  const [cursor, setCursor] = useState<string | undefined>(undefined)

  const entitiesQuery = useEntitiesList()
  const departmentsQuery = useDepartmentsList()
  const employeesQuery = useEmployeesList({
    cursor,
    entityId: toFilterValue(entitySelection),
    department: toFilterValue(departmentSelection),
  })

  // Changing a filter restarts pagination from the first page so the cursor never points into a
  // differently-filtered result set.
  const onEntityChange = (value: string) => {
    setEntitySelection(value)
    setCursor(undefined)
  }
  const onDepartmentChange = (value: string) => {
    setDepartmentSelection(value)
    setCursor(undefined)
  }

  const entities = entitiesQuery.data?.data ?? []
  const departments = departmentsQuery.data?.data ?? []
  const employees = employeesQuery.data?.data ?? []
  const nextCursor = employeesQuery.data?.nextCursor ?? null

  const hasEmployees = employees.length > 0

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader title="Employees" description="The directory of synced signature recipients." />

      <div className="mt-6 flex flex-wrap gap-3">
        <Select value={entitySelection} onValueChange={onEntityChange}>
          <SelectTrigger className="w-56" aria-label="Filter by entity">
            <SelectValue placeholder="All entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION}>All entities</SelectItem>
            {entities.map((entity) => (
              <SelectItem key={entity.id} value={entity.id}>
                {entity.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={departmentSelection} onValueChange={onDepartmentChange}>
          <SelectTrigger className="w-56" aria-label="Filter by department">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION}>All departments</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department.name} value={department.name}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {employeesQuery.isPending && <p className="text-sm text-muted-foreground">Loading employees…</p>}

        {employeesQuery.isError && <EmptyState title="Unable to load employees" description="The directory could not be reached. Try again in a moment." />}

        {!employeesQuery.isPending && !employeesQuery.isError && !hasEmployees && (
          <EmptyState title="No employees yet" description="Run a directory synchronization to populate the directory." />
        )}

        {!employeesQuery.isError && hasEmployees && (
          <>
            <DataTable columns={employeeColumns} rows={employees} getRowKey={(employee) => employee.id} />
            {nextCursor !== null && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => setCursor(nextCursor)} disabled={employeesQuery.isFetching}>
                  {employeesQuery.isFetching ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
