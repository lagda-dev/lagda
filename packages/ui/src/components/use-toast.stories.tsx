import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "./button"
import { Toaster } from "./toaster"
import { useToast } from "./use-toast"

const meta: Meta = {
  title: "Hooks/useToast",
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj

const UseToastDemo = () => {
  const { toast, dismiss } = useToast()
  return (
    <div className="flex gap-2">
      <Button onClick={() => toast({ title: "Hook fired", description: "toast() was called from useToast." })}>toast()</Button>
      <Button variant="outline" onClick={() => dismiss()}>
        dismiss()
      </Button>
      <Toaster />
    </div>
  )
}

export const Default: Story = {
  render: () => <UseToastDemo />,
}
