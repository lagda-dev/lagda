import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "../Button/Button"
import { Toaster } from "../Toaster/Toaster"
import { useToast } from "./useToast"

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
