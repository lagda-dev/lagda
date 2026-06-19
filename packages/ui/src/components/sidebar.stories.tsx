import type { Meta, StoryObj } from "@storybook/react"
import { LayoutDashboard, Mail, Settings, Users } from "lucide-react"
import { Sidebar, type SidebarNavItem } from "./sidebar"

const meta: Meta<typeof Sidebar> = {
  title: "App Shell/Sidebar",
  component: Sidebar,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Sidebar>

const items: SidebarNavItem[] = [
  { label: "Dashboard", href: "#dashboard", icon: LayoutDashboard, isActive: true },
  { label: "Templates", href: "#templates", icon: Mail },
  { label: "Employees", href: "#employees", icon: Users },
  { label: "Settings", href: "#settings", icon: Settings },
]

export const Default: Story = {
  render: () => (
    <div className="h-[480px]">
      <Sidebar header="Lagda" items={items} footer={<span className="px-3 text-xs text-muted-foreground">v0.1.0</span>} />
    </div>
  ),
}
