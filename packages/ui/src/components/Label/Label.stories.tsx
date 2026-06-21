import type { Meta, StoryObj } from "@storybook/react"
import { Input } from "../Input/Input"
import { Label } from "./Label"

const meta: Meta<typeof Label> = {
  title: "Components/Label",
  component: Label,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Label>

export const Default: Story = { args: { children: "Email" } }

export const WithInput: Story = {
  render: () => (
    <div className="grid w-72 gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="name@example.com" />
    </div>
  ),
}
