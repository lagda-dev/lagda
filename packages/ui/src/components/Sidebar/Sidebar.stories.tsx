import type { Meta, StoryObj } from "@storybook/react"
import { LayoutDashboard, Mail, Settings, Users } from "lucide-react"
import { Logo } from "../Logo/Logo"
import { Sidebar, type SidebarNavGroup, type SidebarNavItem } from "./Sidebar"

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
      <Sidebar header={<Logo size={24} />} items={items} footer={<span className="px-3 text-xs text-muted-foreground">v0.1.0</span>} />
    </div>
  ),
}

const groups: SidebarNavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "#dashboard", isActive: true }] },
  {
    label: "Signatures",
    items: [
      { label: "Templates", href: "#templates" },
      { label: "Assignments", href: "#assignments" },
      { label: "Synchronizations", href: "#synchronizations" },
    ],
  },
  {
    label: "Directory",
    items: [
      { label: "Employees", href: "#employees" },
      { label: "Entities", href: "#entities" },
    ],
  },
]

export const Grouped: Story = {
  render: () => (
    <div className="h-[480px]">
      <Sidebar header={<Logo size={24} />} groups={groups} footer={<span className="px-3 font-mono text-xs text-faint">v0.1.0-beta</span>} />
    </div>
  ),
}
