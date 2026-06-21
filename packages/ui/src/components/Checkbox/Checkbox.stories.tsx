import type { Meta, StoryObj } from "@storybook/react"
import { Checkbox } from "./Checkbox"
import { Label } from "../Label/Label"

const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Checkbox>

export const Default: Story = { args: {} }
export const Checked: Story = { args: { defaultChecked: true } }
export const Disabled: Story = { args: { disabled: true } }

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
}
