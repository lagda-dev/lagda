import type { Meta, StoryObj } from "@storybook/react"
import { StatusBadge } from "./status-badge"

const meta: Meta<typeof StatusBadge> = {
  title: "Components/StatusBadge",
  component: StatusBadge,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof StatusBadge>

export const Synced: Story = { args: { status: "synced", children: "Synced" } }
export const Syncing: Story = { args: { status: "syncing", children: "Syncing" } }
export const Failed: Story = { args: { status: "failed", children: "Failed" } }
export const Queued: Story = { args: { status: "queued", children: "Queued" } }

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <StatusBadge status="synced">Synced</StatusBadge>
      <StatusBadge status="syncing">Syncing</StatusBadge>
      <StatusBadge status="failed">Failed</StatusBadge>
      <StatusBadge status="queued">Queued</StatusBadge>
    </div>
  ),
}
