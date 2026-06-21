import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "../Button/Button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./Tooltip"

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>Synchronize the directory now</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
}
