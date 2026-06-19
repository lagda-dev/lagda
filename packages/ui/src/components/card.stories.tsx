import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card"

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Marketing signature</CardTitle>
        <CardDescription>Applied to the marketing entity.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Last deployed 2 days ago to 24 employees.</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Preview</Button>
        <Button>Edit</Button>
      </CardFooter>
    </Card>
  ),
}
