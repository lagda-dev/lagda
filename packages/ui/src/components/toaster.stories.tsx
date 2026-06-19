import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "./button"
import { Toaster } from "./toaster"
import { useToast } from "./use-toast"

const meta: Meta<typeof Toaster> = {
  title: "Components/Toaster",
  component: Toaster,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Toaster>

const ToasterDemo = () => {
  const { toast } = useToast()
  return (
    <div>
      <Button onClick={() => toast({ title: "Saved", description: "Your template was saved." })}>Trigger toast</Button>
      <Toaster />
    </div>
  )
}

export const Default: Story = {
  render: () => <ToasterDemo />,
}
