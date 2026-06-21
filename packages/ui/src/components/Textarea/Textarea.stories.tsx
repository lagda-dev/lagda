import type { Meta, StoryObj } from "@storybook/react"
import { Textarea } from "./Textarea"

const meta: Meta<typeof Textarea> = {
  title: "Components/Textarea",
  component: Textarea,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Textarea>

export const Default: Story = { args: { placeholder: "Type your message here." } }
export const Disabled: Story = { args: { disabled: true, placeholder: "Disabled" } }
export const WithValue: Story = { args: { defaultValue: "Best regards,\nThe Lagda team" } }
