import type { Meta, StoryObj } from "@storybook/react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./Select"

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Select>

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select an entity" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Entities</SelectLabel>
          <SelectItem value="marketing">Marketing</SelectItem>
          <SelectItem value="sales">Sales</SelectItem>
          <SelectItem value="support">Support</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}
