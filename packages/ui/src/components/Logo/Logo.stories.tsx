import type { Meta, StoryObj } from "@storybook/react"
import { Logo, Logomark } from "./Logo"

const meta: Meta<typeof Logo> = {
  title: "Brand/Logo",
  component: Logo,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Logo>

export const Default: Story = { args: { size: 40 } }

export const MarkOnly: Story = { render: () => <Logomark size={40} /> }

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <Logomark size={64} />
      <Logomark size={40} />
      <Logomark size={28} />
      <Logomark size={20} />
    </div>
  ),
}

export const Lockups: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <Logo size={40} />
      <Logo size={28} />
      <Logo size={20} />
    </div>
  ),
}

export const OnDark: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div className="dark rounded-lg bg-background p-8">
      <Logo size={40} />
    </div>
  ),
}
