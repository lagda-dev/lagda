import type { Meta, StoryObj } from "@storybook/react"
import { Mail } from "lucide-react"
import { Button } from "./button"
import { EmptyState } from "./empty-state"

const meta: Meta<typeof EmptyState> = {
  title: "App Shell/EmptyState",
  component: EmptyState,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof EmptyState>

export const Default: Story = {
  render: () => (
    <EmptyState
      icon={Mail}
      title="No templates yet"
      description="Create your first signature template to get started."
      action={<Button>New template</Button>}
    />
  ),
}

export const Minimal: Story = {
  render: () => <EmptyState title="No results" description="Try adjusting your filters." />,
}
