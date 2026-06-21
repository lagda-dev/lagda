import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "../Button/Button"
import { Toaster } from "../Toaster/Toaster"
import { useToast } from "../useToast/useToast"

const meta: Meta = {
  title: "Components/Toast",
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj

const ToastDemo = () => {
  const { toast } = useToast()
  return (
    <div className="flex gap-2">
      <Button onClick={() => toast({ title: "Synchronization completed", description: "24 signatures deployed." })}>Show toast</Button>
      <Button
        variant="destructive"
        onClick={() =>
          toast({
            variant: "destructive",
            title: "Synchronization failed",
            description: "Check the directory connection.",
          })
        }
      >
        Show error
      </Button>
      <Toaster />
    </div>
  )
}

export const Default: Story = {
  render: () => <ToastDemo />,
}
