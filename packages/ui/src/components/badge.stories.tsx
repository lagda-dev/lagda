import type { Meta, StoryObj } from "@storybook/react"
import { Badge } from "./badge"

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Badge>

export const Default: Story = { args: { children: "Active" } }
export const Secondary: Story = { args: { variant: "secondary", children: "Draft" } }
export const Destructive: Story = { args: { variant: "destructive", children: "Failed" } }
export const Outline: Story = { args: { variant: "outline", children: "Pending" } }

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge>Active</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="destructive">Failed</Badge>
      <Badge variant="outline">Pending</Badge>
    </div>
  ),
}
