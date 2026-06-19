import type { Meta, StoryObj } from "@storybook/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="signature" className="w-96">
      <TabsList>
        <TabsTrigger value="signature">Signature</TabsTrigger>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="signature" className="text-sm text-muted-foreground">
        Edit the signature template here.
      </TabsContent>
      <TabsContent value="assignments" className="text-sm text-muted-foreground">
        Choose which employees receive this signature.
      </TabsContent>
      <TabsContent value="history" className="text-sm text-muted-foreground">
        Review past deployments.
      </TabsContent>
    </Tabs>
  ),
}
