import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "./button"
import { PageHeader } from "./page-header"

const meta: Meta<typeof PageHeader> = {
  title: "App Shell/PageHeader",
  component: PageHeader,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof PageHeader>

export const Default: Story = {
  render: () => <PageHeader title="Templates" description="Design and manage your email-signature templates." actions={<Button>New template</Button>} />,
}

export const WithoutActions: Story = {
  render: () => <PageHeader title="Audit events" description="Read-only history of directory reads and signature writes." />,
}
