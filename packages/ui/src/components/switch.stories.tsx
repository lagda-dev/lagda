import type { Meta, StoryObj } from "@storybook/react"
import { Label } from "./label"
import { Switch } from "./switch"

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Switch>

export const Default: Story = { args: {} }
export const Checked: Story = { args: { defaultChecked: true } }
export const Disabled: Story = { args: { disabled: true } }

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="notifications" />
      <Label htmlFor="notifications">Enable Slack notifications</Label>
    </div>
  ),
}
