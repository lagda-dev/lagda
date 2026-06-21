import type { Meta, StoryObj } from "@storybook/react"
import { Input } from "./Input"

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Input>

export const Default: Story = { args: { placeholder: "name@example.com" } }
export const Email: Story = { args: { type: "email", placeholder: "name@example.com" } }
export const Disabled: Story = { args: { disabled: true, placeholder: "Disabled" } }
export const WithValue: Story = { args: { defaultValue: "Acme Inc." } }
