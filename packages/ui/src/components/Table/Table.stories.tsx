import type { Meta, StoryObj } from "@storybook/react"
import { Badge } from "../Badge/Badge"
import { DataTable, type DataTableColumn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./Table"

const meta: Meta<typeof Table> = {
  title: "Components/Table",
  component: Table,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Table>

interface Employee {
  id: string
  name: string
  email: string
  status: "active" | "inactive"
}

const employees: Employee[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com", status: "active" },
  { id: "2", name: "Alan Turing", email: "alan@example.com", status: "active" },
  { id: "3", name: "Grace Hopper", email: "grace@example.com", status: "inactive" },
]

export const Primitive: Story = {
  render: () => (
    <Table className="w-[28rem]">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell>{employee.name}</TableCell>
            <TableCell>{employee.email}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

const columns: DataTableColumn<Employee>[] = [
  { header: "Name", cell: (employee) => employee.name },
  { header: "Email", cell: (employee) => employee.email },
  {
    header: "Status",
    cell: (employee) => <Badge variant={employee.status === "active" ? "default" : "secondary"}>{employee.status}</Badge>,
  },
]

export const DataTableExample: Story = {
  render: () => (
    <div className="w-[32rem]">
      <DataTable columns={columns} rows={employees} getRowKey={(employee) => employee.id} />
    </div>
  ),
}

export const DataTableEmpty: Story = {
  render: () => (
    <div className="w-[32rem]">
      <DataTable columns={columns} rows={[]} getRowKey={(employee) => employee.id} emptyMessage="No employees yet." />
    </div>
  ),
}
