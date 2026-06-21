import type { Meta, StoryObj } from "@storybook/react"
import { Plus } from "lucide-react"
import { Button } from "./Button"

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Button>

export const Default: Story = { args: { children: "Button" } }
export const Secondary: Story = { args: { variant: "secondary", children: "Secondary" } }
export const Destructive: Story = { args: { variant: "destructive", children: "Delete" } }
export const Outline: Story = { args: { variant: "outline", children: "Outline" } }
export const Ghost: Story = { args: { variant: "ghost", children: "Ghost" } }
export const Link: Story = { args: { variant: "link", children: "Link" } }

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Add">
        <Plus />
      </Button>
    </div>
  ),
}

export const Disabled: Story = { args: { disabled: true, children: "Disabled" } }
